import { CashbackErrors } from "@/modules/cashback/errors";
import { GetCashbackBalance } from "@/modules/cashback/useCases";
import { ValidateCoupon } from "@/modules/coupons/useCases";
import { InventoryLifecycle } from "@/modules/inventory/lifecycle";
import { LoyaltyErrors } from "@/modules/loyalty/errors";
import { GetLoyaltyBalance } from "@/modules/loyalty/useCases";
import { calculatePlatformFees } from "@/modules/platformFees/calculateFees";
import { getCompanyFeeMode, listEffectiveFees } from "@/modules/platformFees/effectiveFees";
import { DomainError } from "@/shared/errors";
import type { PrismaInstance } from "@/shared/infra/sql";
import type { CreateOrderBody, OrderReturn } from "../dtos";
import { OrderErrors } from "../errors";

export class CreateOrder {
	constructor(private readonly prisma: PrismaInstance) {}

	async execute(userId: string, data: CreateOrderBody, requestContext?: { ip?: string; userAgent?: string }): Promise<OrderReturn> {
		const {
			addressId,
			couponCode,
			deliveryMethod,
			idempotencyKey,
			items,
			redeemCashbackCents,
			redeemLoyaltyPoints,
			unitSlug,
			slug,
		} = data;

		if (items.length === 0) throw new DomainError(OrderErrors.EMPTY_ORDER);

		const company = await this.prisma.company.findUnique({ where: { slug } });
		if (!company) throw new DomainError(OrderErrors.COMPANY_NOT_FOUND);

		const unit = await this.prisma.unit.findFirst({
			where: { active: true, companyId: company.id, slug: unitSlug },
		});
		if (!unit) throw new DomainError(OrderErrors.UNIT_NOT_FOUND);
		const unitId = unit.id;

		const customer = await this.prisma.customer.upsert({
			create: { companyId: company.id, userId },
			update: {},
			where: { companyId_userId: { companyId: company.id, userId } },
		});
		if (customer.companyId !== company.id) throw new DomainError(OrderErrors.CUSTOMER_NOT_FOUND);
		const existingOrder = await this.findOrderByIdempotencyKey(customer.id, idempotencyKey);
		if (existingOrder) return existingOrder;

		if (deliveryMethod === "delivery") {
			const address = await this.prisma.address.findFirst({
				where: { customerId: customer.id, deletedAt: null, id: addressId ?? undefined },
			});
			if (!address) throw new DomainError(OrderErrors.DELIVERY_ADDRESS_REQUIRED);
		}

		// Resolve prices from unit product associations
		const unitProducts = (await this.prisma.unitProduct.findMany({
			include: {
				additionalOptions: true,
				optionOverrides: true,
				product: { include: { optionGroups: { include: { options: true } } } },
			},
			where: { id: { in: items.map(i => i.unitProductId) }, unitId },
		} as never)) as Array<{
			id: string;
			priceCentsOverride: number | null;
			promotionalPriceCents: number | null;
			stock: number | null;
			additionalOptions: Array<{
				available: boolean;
				groupId: string;
				id: string;
				maxPerItem: number | null;
				name: string;
				priceDeltaCents: number;
			}>;
			optionOverrides: Array<{
				available: boolean | null;
				maxPerItem: number | null;
				name: string | null;
				optionId: string;
				priceDeltaCents: number | null;
			}>;
			product: {
				basePriceCents: number;
				id: string;
				title: string;
				optionGroups: Array<{
					id: string;
					maxSelect: number | null;
					required: boolean;
					priceRule: string;
					allowRepeatSelection: boolean;
					name: string;
					options: Array<{
						available: boolean;
						id: string;
						maxPerItem: number | null;
						name: string;
						priceDeltaCents: number;
					}>;
				}>;
			};
		}>;
		const exclusionStore = this.prisma as unknown as {
			unitProductExcludedOption: {
				findMany: (args: {
					where: { unitProductId: { in: string[] } };
				}) => Promise<{ optionId: string; unitProductId: string }[]>;
			};
		};
		const exclusions = exclusionStore.unitProductExcludedOption
			? await exclusionStore.unitProductExcludedOption.findMany({
					where: { unitProductId: { in: unitProducts.map(association => association.id) } },
				})
			: [];
		const excludedByAssociation = new Map<string, Set<string>>();
		for (const exclusion of exclusions) {
			const ids = excludedByAssociation.get(exclusion.unitProductId) ?? new Set<string>();
			ids.add(exclusion.optionId);
			excludedByAssociation.set(exclusion.unitProductId, ids);
		}

		const resolvedItems = items.map((item, lineIndex) => {
			const assoc = unitProducts.find(up => up.id === item.unitProductId);
			if (!assoc) throw new DomainError(OrderErrors.INVALID_ITEM);
			const selections = item.options ?? [];
			if (new Set(selections.map(selection => selection.optionId)).size !== selections.length) {
				throw new DomainError(OrderErrors.INVALID_OPTIONS);
			}
			const excludedOptionIds = excludedByAssociation.get(assoc.id) ?? new Set<string>();
			let optionDelta = 0;
			const snapshots: {
				groupName: string;
				optionId: string;
				optionName: string;
				priceDeltaCents: number;
				quantity: number;
			}[] = [];
			const overridesByOptionId = new Map(
				(assoc.optionOverrides ?? []).map(override => [override.optionId, override]),
			);
			const optionGroups = (assoc.product.optionGroups ?? []).map(group => ({
				...group,
				options: [
					...group.options.map(option => {
						const override = overridesByOptionId.get(option.id);
						return {
							...option,
							available: override?.available ?? option.available,
							maxPerItem: override?.maxPerItem ?? option.maxPerItem,
							name: override?.name ?? option.name,
							priceDeltaCents: override?.priceDeltaCents ?? option.priceDeltaCents,
						};
					}),
					...(assoc.additionalOptions ?? []).filter(option => option.groupId === group.id),
				],
			}));
			for (const group of optionGroups) {
				const selected = selections
					.map(selection => ({
						...selection,
						option: group.options.find(option => option.id === selection.optionId),
					}))
					.filter(selection => selection.option);
				const selectedQuantity = selected.reduce((sum, selection) => sum + selection.quantity, 0);
				if (
					(group.required && selectedQuantity < 1) ||
					(group.maxSelect != null && selectedQuantity > group.maxSelect)
				)
					throw new DomainError(OrderErrors.INVALID_OPTIONS);
				for (const selection of selected) {
					const option = selection.option!;
					if (
						option.available === false ||
						excludedOptionIds.has(option.id) ||
						(!group.allowRepeatSelection && selection.quantity > 1) ||
						(option.maxPerItem !== null && selection.quantity > option.maxPerItem)
					)
						throw new DomainError(OrderErrors.INVALID_OPTIONS);
					snapshots.push({
						groupName: group.name,
						optionId: option.id,
						optionName: option.name,
						priceDeltaCents: option.priceDeltaCents,
						quantity: selection.quantity,
					});
				}
				const validIds = new Set(group.options.map(option => option.id));
				if (
					selections.some(
						selection =>
							!optionGroups.some(candidate =>
								candidate.options.some(option => option.id === selection.optionId),
							),
					) ||
					selected.some(selection => !validIds.has(selection.optionId))
				)
					throw new DomainError(OrderErrors.INVALID_OPTIONS);
				const deltas = selected.flatMap(selection =>
					Array.from({ length: selection.quantity }, () => selection.option!.priceDeltaCents),
				);
				if (group.priceRule === "highest") optionDelta += deltas.length ? Math.max(...deltas) : 0;
				else if (group.priceRule === "average")
					optionDelta += deltas.length
						? Math.round(deltas.reduce((sum, delta) => sum + delta, 0) / deltas.length)
						: 0;
				else optionDelta += deltas.reduce((sum, delta) => sum + delta, 0);
			}
			if (
				selections.some(
					selection =>
						!optionGroups.some(group => group.options.some(option => option.id === selection.optionId)),
				)
			) {
				throw new DomainError(OrderErrors.INVALID_OPTIONS);
			}
			const unitPrice =
				(assoc.promotionalPriceCents ?? assoc.priceCentsOverride ?? assoc.product.basePriceCents) +
				optionDelta;
			return {
				lineIndex,
				legacyStock: assoc.stock,
				note: item.note ?? null,
				options: snapshots,
				productId: assoc.product.id,
				productName: assoc.product.title,
				quantity: item.quantity,
				selectedOptions: selections,
				total: unitPrice * item.quantity,
				unitPrice,
				unitProductId: assoc.id,
			};
		});

		const subtotal = resolvedItems.reduce((sum, i) => sum + i.total, 0);
		const deliveryFee = deliveryMethod === "delivery" ? unit.deliveryFee : 0;
		const feeMode = await getCompanyFeeMode(this.prisma, company.id);
		const effectiveFees = await listEffectiveFees(this.prisma, company.id);
		const calculatedFees = calculatePlatformFees(
			effectiveFees,
			resolvedItems.map(item => ({
				key: String(item.lineIndex),
				quantity: item.quantity,
				unitPrice: item.unitPrice,
			})),
		);

		let couponId: string | null = null;
		let discountCents = 0;
		if (couponCode) {
			const couponResult = await new ValidateCoupon(this.prisma).execute({
				code: couponCode,
				orderSubtotal: subtotal,
				slug,
				unitId,
			});
			couponId = couponResult.couponId;
			discountCents = couponResult.discountCents;
		}

		let cashbackCentsRedeemed = 0;
		if (redeemCashbackCents && redeemCashbackCents > 0) {
			const { balanceCents } = await new GetCashbackBalance(this.prisma).execute(userId, slug);
			if (redeemCashbackCents > balanceCents) throw new DomainError(CashbackErrors.INSUFFICIENT_BALANCE);
			cashbackCentsRedeemed = redeemCashbackCents;
		}

		let loyaltyPointsRedeemed = 0;
		if (redeemLoyaltyPoints && redeemLoyaltyPoints > 0) {
			const { balancePoints } = await new GetLoyaltyBalance(this.prisma).execute(userId, slug);
			if (redeemLoyaltyPoints > balancePoints) throw new DomainError(LoyaltyErrors.INSUFFICIENT_BALANCE);
			loyaltyPointsRedeemed = redeemLoyaltyPoints;
		}

		let remainingSubtotal = Math.max(0, subtotal - discountCents);
		cashbackCentsRedeemed = Math.min(cashbackCentsRedeemed, remainingSubtotal);
		remainingSubtotal -= cashbackCentsRedeemed;
		loyaltyPointsRedeemed = Math.min(loyaltyPointsRedeemed, remainingSubtotal);
		remainingSubtotal -= loyaltyPointsRedeemed;
		const total = remainingSubtotal + deliveryFee + calculatedFees.feeTotalCents;

		try {
			const order = await this.prisma.$transaction(async tx => {
			const created = await tx.order.create({
				data: {
					marketingAttribution: data.marketingAttribution ? {
                        ...data.marketingAttribution,
                        sourceUrl: data.marketingAttribution.sourceUrl ? (() => { const url = new URL(data.marketingAttribution.sourceUrl); return `${url.origin}${url.pathname}`; })() : undefined,
                        consentedAt: new Date().toISOString(),
                        ip: requestContext?.ip?.slice(0, 64),
                        userAgent: requestContext?.userAgent?.slice(0, 1024),
                    } : undefined,
                    addressId: addressId ?? null,
					cashbackCentsRedeemed,
					companyId: company.id,
					couponId,
					customerId: customer.id,
					deliveryFee,
					deliveryMethod,
					discountCents,
					idempotencyKey,
					loyaltyPointsRedeemed,
					feeMode,
					feeTotalCents: calculatedFees.feeTotalCents,
					subtotal,
					total,
					unitId,
					// Zero-value orders do not need an external payment authorization.
					status: total === 0 ? "recebido" : "awaiting_payment",
				},
			});

			await tx.orderStatusEvent?.create({
				data: {
					orderId: created.id,
					status: created.status,
				},
			});

			if (couponId) {
				await tx.coupon.update({
					data: { usedCount: { increment: 1 } },
					where: { id: couponId },
				});
			}

			if (cashbackCentsRedeemed > 0) {
				await tx.cashbackLedger.create({
					data: {
						amount: -cashbackCentsRedeemed,
						customerId: customer.id,
						orderId: created.id,
						type: "redemption",
					},
				});
			}

			if (loyaltyPointsRedeemed > 0) {
				await tx.loyaltyLedger.create({
					data: {
						amount: -loyaltyPointsRedeemed,
						customerId: customer.id,
						orderId: created.id,
						type: "redemption",
					},
				});
			}

			const createdItems: Array<{ id: string; item: (typeof resolvedItems)[number] }> = [];
			for (const item of resolvedItems) {
				const orderItem = await tx.orderItem.create({
					data: {
						...item,
						legacyStock: undefined,
						lineIndex: undefined,
						options: undefined,
						orderId: created.id,
						selectedOptions: undefined,
					} as never,
				});
				createdItems.push({ id: orderItem.id, item });
				if (item.options.length > 0) {
					await tx.orderItemOption.createMany({
						data: item.options.map(option => ({ ...option, orderItemId: orderItem.id })),
					});
				}
			}

			for (const fee of calculatedFees.fees) {
				const snapshot = await tx.orderFeeSnapshot.create({
					data: {
						amountCents: fee.amountCents,
						applicationScope: fee.applicationScope,
						configuredFixed: fee.fixedValue,
						configuredPercentage: fee.percentageValue,
						displayMode: fee.displayMode,
						name: fee.name,
						orderId: created.id,
						platformFeeId: fee.id,
					},
				});
				if (fee.items.length > 0) {
					await tx.orderItemFeeSnapshot.createMany({
						data: fee.items.map(itemFee => ({
							amountCents: itemFee.amountCents,
							orderFeeSnapshotId: snapshot.id,
							orderItemId: createdItems[Number(itemFee.itemKey)]!.id,
							unitAmountCents: itemFee.unitAmountCents,
						})),
					});
				}
			}
			const costs = await InventoryLifecycle.reserve(
				tx,
				created.id,
				unitId,
				createdItems.map(({ id, item }) => ({
					legacyStock: item.legacyStock,
					options: item.selectedOptions,
					orderItemId: id,
					productId: item.productId,
					quantity: item.quantity,
					unitProductId: item.unitProductId,
				})),
			);
			const itemDiscount = Math.min(subtotal, discountCents + cashbackCentsRedeemed + loyaltyPointsRedeemed);
			let distributed = 0;
			for (const [index, { id, item }] of createdItems.entries()) {
				const share =
					index === createdItems.length - 1
						? itemDiscount - distributed
						: Math.floor((itemDiscount * item.total) / subtotal);
				distributed += share;
				const costCents = costs.has(id) ? Math.round(costs.get(id)!) : null;
				await tx.orderItem.update({
					data: { costCents, costCentsAtSale: costCents, netRevenueCents: item.total - share },
					where: { id },
				});
			}

				return tx.order.findUniqueOrThrow({
					include: {
						feeSnapshots: { include: { itemFees: true } },
						items: { include: { feeSnapshots: true, optionSnapshots: true } },
					},
					where: { id: created.id },
				});
			});

			return {
				...order,
				fees: order.feeSnapshots ?? [],
				items: order.items.map(item => {
					const embeddedFeeCents = (item.feeSnapshots ?? [])
						.filter(fee => (order.feeSnapshots ?? []).find(snapshot => snapshot.id === fee.orderFeeSnapshotId)?.displayMode === "embedded")
						.reduce((sum, fee) => sum + fee.amountCents, 0);
					return {
						...item,
						displayTotal: item.total + embeddedFeeCents,
						displayUnitPrice: item.unitPrice + Math.round(embeddedFeeCents / item.quantity),
						fees: item.feeSnapshots ?? [],
						options: item.optionSnapshots,
					};
				}),
			};
		} catch (error) {
			if (!isDuplicateIdempotencyKeyError(error)) throw error;
			const duplicate = await this.findOrderByIdempotencyKey(customer.id, idempotencyKey);
			if (!duplicate) throw error;
			return duplicate;
		}
	}

	private async findOrderByIdempotencyKey(customerId: string, idempotencyKey: string): Promise<OrderReturn | null> {
		const order = await this.prisma.order.findFirst({
			include: {
				feeSnapshots: { include: { itemFees: true } },
				items: { include: { feeSnapshots: true, optionSnapshots: true } },
			},
			where: { customerId, idempotencyKey },
		});
		if (!order) return null;

		return {
			...order,
			fees: order.feeSnapshots ?? [],
			items: order.items.map(item => {
				const embeddedFeeCents = (item.feeSnapshots ?? [])
					.filter(fee => (order.feeSnapshots ?? []).find(snapshot => snapshot.id === fee.orderFeeSnapshotId)?.displayMode === "embedded")
					.reduce((sum, fee) => sum + fee.amountCents, 0);
				return {
					...item,
					displayTotal: item.total + embeddedFeeCents,
					displayUnitPrice: item.unitPrice + Math.round(embeddedFeeCents / item.quantity),
					fees: item.feeSnapshots ?? [],
					options: item.optionSnapshots,
				};
			}),
		};
	}

}

function isDuplicateIdempotencyKeyError(error: unknown): boolean {
	if (typeof error !== "object" || error === null || !("code" in error)) return false;
	return error.code === "P2002";
}
