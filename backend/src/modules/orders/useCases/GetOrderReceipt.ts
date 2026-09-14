import { DomainError } from "@/shared/errors";
import type { PrismaInstance } from "@/shared/infra/sql";
import type { Role } from "@/shared/permissions";
import { defaultReceiptTemplate } from "@/modules/receiptTemplates/defaultReceiptTemplate";
import { isValidReceiptTemplate } from "@/modules/receiptTemplates/validateReceiptTemplate";
import type { OrderReceiptReturn } from "../dtos";
import { OrderErrors } from "../errors";

export class GetOrderReceipt {
	constructor(private readonly prisma: PrismaInstance) {}

	async execute(
		companyId: string | null,
		orderId: string,
		role: Role,
		userId: string,
	): Promise<OrderReceiptReturn> {
		const order = await this.prisma.order.findFirst({
			include: {
				address: true,
				company: { select: { receiptTemplate: true } },
				customer: { include: { user: { select: { name: true, phoneNumber: true } } } },
				items: { include: { optionSnapshots: true } },
				payment: { select: { method: true, status: true } },
				preparedBy: { select: { id: true, name: true } },
				unit: { select: { id: true, name: true } },
			},
			where: {
				...(companyId ? { companyId } : {}),
				id: orderId,
				...(role === "kitchen" ? { unit: { staffUnits: { some: { userId } } } } : {}),
			},
		});

		if (!order) throw new DomainError(OrderErrors.ORDER_NOT_FOUND);

		return {
			address: order.address
				? {
						addressLine: order.address.addressLine,
						city: order.address.city,
						complement: order.address.complement,
						neighborhood: order.address.neighborhood,
						number: order.address.number,
						reference: order.address.reference,
						state: order.address.state,
						zipCode: order.address.zipCode,
					}
				: null,
			cashbackCentsRedeemed: order.cashbackCentsRedeemed,
			createdAt: order.createdAt,
			customer: {
				name: order.customer.user.name ?? "",
				phone: order.customer.phone ?? order.customer.user.phoneNumber ?? null,
			},
			deliveryFee: order.deliveryFee,
			deliveryMethod: order.deliveryMethod,
			discountCents: order.discountCents,
			displayNumber: order.displayNumber,
			id: order.id,
			items: order.items.map(item => ({
				id: item.id,
				note: item.note,
				options: item.optionSnapshots.map(option => ({
					groupName: option.groupName,
					optionName: option.optionName,
					priceDeltaCents: option.priceDeltaCents,
					quantity: option.quantity,
				})),
				productName: item.productName,
				quantity: item.quantity,
				total: item.total,
				unitPrice: item.unitPrice,
			})),
			loyaltyPointsRedeemed: order.loyaltyPointsRedeemed,
			payment: order.payment,
			preparedBy: order.preparedBy,
			status: order.status,
			subtotal: order.subtotal,
			template: isValidReceiptTemplate(order.company.receiptTemplate)
				? order.company.receiptTemplate
				: defaultReceiptTemplate,
			total: order.total,
			unit: order.unit,
		};
	}
}
