import { DomainError } from "@/shared/errors";
import type { PrismaInstance } from "@/shared/infra/sql";

type Transaction = Parameters<Parameters<PrismaInstance["$transaction"]>[0]>[0];

export interface ReservableOrderItem {
	orderItemId: string;
	productId: string;
	quantity: number;
	unitProductId: string;
	legacyStock: number | null;
	options: Array<{ optionId: string; quantity: number }>;
}

const number = (value: unknown) => Number(value ?? 0);

export class InventoryLifecycle {
	static async reserve(tx: Transaction, orderId: string, unitId: string, items: ReservableOrderItem[]) {
		const productIds = [...new Set(items.map(item => item.productId))];
		const optionIds = [...new Set(items.flatMap(item => item.options.map(option => option.optionId)))];
		const [baseRows, optionRows, localRows] = await Promise.all([
			tx.productRecipeIngredient.findMany({ where: { productId: { in: productIds } } }),
			tx.optionRecipeIngredient.findMany({ where: { optionId: { in: optionIds } } }),
			tx.localOptionRecipeIngredient.findMany({ where: { localOptionId: { in: optionIds } } }),
		]);
		const baseByProduct = new Map<string, typeof baseRows>();
		for (const row of baseRows)
			baseByProduct.set(row.productId, [...(baseByProduct.get(row.productId) ?? []), row]);
		const optionById = new Map<string, Array<{ inventoryItemId: string; quantityDelta: unknown }>>();
		for (const row of [...optionRows, ...localRows.map(row => ({ ...row, optionId: row.localOptionId }))]) {
			optionById.set(row.optionId, [...(optionById.get(row.optionId) ?? []), row]);
		}

		const requirements = new Map<
			string,
			{ inventoryItemId: string; orderItemId: string; quantity: number }
		>();
		const legacy = new Map<string, number>();
		for (const item of items) {
			const base = baseByProduct.get(item.productId) ?? [];
			if (base.length === 0) {
				if (item.legacyStock !== null)
					legacy.set(item.unitProductId, (legacy.get(item.unitProductId) ?? 0) + item.quantity);
				continue;
			}
			const perUnit = new Map(base.map(row => [row.inventoryItemId, number(row.quantity)]));
			for (const selected of item.options) {
				for (const delta of optionById.get(selected.optionId) ?? []) {
					perUnit.set(
						delta.inventoryItemId,
						(perUnit.get(delta.inventoryItemId) ?? 0) + number(delta.quantityDelta) * selected.quantity,
					);
				}
			}
			for (const [inventoryItemId, perUnitQuantity] of perUnit) {
				const quantity = Math.max(0, perUnitQuantity) * item.quantity;
				if (quantity === 0) continue;
				const key = `${item.orderItemId}:${inventoryItemId}`;
				requirements.set(key, { inventoryItemId, orderItemId: item.orderItemId, quantity });
			}
		}

		for (const [unitProductId, quantity] of [...legacy].sort(([a], [b]) => a.localeCompare(b))) {
			const result = await tx.unitProduct.updateMany({
				data: { stock: { decrement: quantity } },
				where: { id: unitProductId, stock: { gte: quantity }, unitId },
			});
			if (result.count !== 1) throw new DomainError("INSUFFICIENT_STOCK");
		}

		const totals = new Map<string, number>();
		for (const requirement of requirements.values())
			totals.set(
				requirement.inventoryItemId,
				(totals.get(requirement.inventoryItemId) ?? 0) + requirement.quantity,
			);
		const costs = new Map<string, number>();
		for (const [inventoryItemId, quantity] of [...totals].sort(([a], [b]) => a.localeCompare(b))) {
			const updated = await tx.$executeRawUnsafe(
				`UPDATE "unit_inventory_balance" SET "reservedQuantity" = "reservedQuantity" + $1::decimal, "updatedAt" = CURRENT_TIMESTAMP WHERE "unitId" = $2 AND "inventoryItemId" = $3 AND "quantity" - "reservedQuantity" >= $1::decimal`,
				quantity,
				unitId,
				inventoryItemId,
			);
			if (updated !== 1) throw new DomainError("INSUFFICIENT_STOCK");
			const balance = await tx.unitInventoryBalance.findUniqueOrThrow({
				where: { unitId_inventoryItemId: { inventoryItemId, unitId } },
			});
			costs.set(inventoryItemId, number(balance.averageCostCents));
		}

		if (requirements.size > 0) {
			await tx.inventoryReservation.createMany({
				data: [...requirements.values()].map(row => ({
					...row,
					orderId,
					unitCostCents: costs.get(row.inventoryItemId) ?? 0,
					unitId,
				})),
			});
		}
		const costByOrderItem = new Map<string, number>();
		for (const row of requirements.values())
			costByOrderItem.set(
				row.orderItemId,
				(costByOrderItem.get(row.orderItemId) ?? 0) + row.quantity * (costs.get(row.inventoryItemId) ?? 0),
			);
		return costByOrderItem;
	}

	static async release(tx: Transaction, orderId: string) {
		const reservations = await tx.inventoryReservation.findMany({ where: { orderId, status: "reserved" } });
		for (const reservation of reservations) {
			await tx.unitInventoryBalance.update({
				data: { reservedQuantity: { decrement: reservation.quantity } },
				where: {
					unitId_inventoryItemId: {
						inventoryItemId: reservation.inventoryItemId,
						unitId: reservation.unitId,
					},
				},
			});
		}
		await tx.inventoryReservation.updateMany({
			data: { status: "released" },
			where: { orderId, status: "reserved" },
		});
		const legacyItems = await tx.orderItem.findMany({
			where: { inventoryReservations: { none: {} }, orderId, unitProductId: { not: null } },
		});
		for (const item of legacyItems)
			await tx.unitProduct.updateMany({
				data: { stock: { increment: item.quantity } },
				where: { id: item.unitProductId!, stock: { not: null } },
			});
	}

	static async restore(tx: Transaction, orderId: string, unitId: string) {
		const reservations = await tx.inventoryReservation.findMany({ where: { orderId, status: "released" } });
		const totals = new Map<string, number>();
		for (const reservation of reservations)
			totals.set(
				reservation.inventoryItemId,
				(totals.get(reservation.inventoryItemId) ?? 0) + number(reservation.quantity),
			);
		for (const [inventoryItemId, quantity] of [...totals].sort(([a], [b]) => a.localeCompare(b))) {
			const updated = await tx.$executeRawUnsafe(
				`UPDATE "unit_inventory_balance" SET "reservedQuantity" = "reservedQuantity" + $1::decimal, "updatedAt" = CURRENT_TIMESTAMP WHERE "unitId" = $2 AND "inventoryItemId" = $3 AND "quantity" - "reservedQuantity" >= $1::decimal`,
				quantity,
				unitId,
				inventoryItemId,
			);
			if (updated !== 1) throw new DomainError("INSUFFICIENT_STOCK");
		}
		await tx.inventoryReservation.updateMany({
			data: { status: "reserved" },
			where: { orderId, status: "released" },
		});
		const legacyItems = await tx.orderItem.findMany({
			where: { inventoryReservations: { none: {} }, orderId, unitProductId: { not: null } },
		});
		for (const item of legacyItems) {
			const result = await tx.unitProduct.updateMany({
				data: { stock: { decrement: item.quantity } },
				where: { id: item.unitProductId!, stock: { gte: item.quantity }, unitId },
			});
			if (result.count !== 1) throw new DomainError("INSUFFICIENT_STOCK");
		}
	}

	static async consume(tx: Transaction, orderId: string, userId?: string) {
		const reservations = await tx.inventoryReservation.findMany({ where: { orderId, status: "reserved" } });
		for (const reservation of reservations) {
			const balance = await tx.unitInventoryBalance.update({
				data: {
					quantity: { decrement: reservation.quantity },
					reservedQuantity: { decrement: reservation.quantity },
				},
				where: {
					unitId_inventoryItemId: {
						inventoryItemId: reservation.inventoryItemId,
						unitId: reservation.unitId,
					},
				},
			});
			await tx.inventoryMovement.create({
				data: {
					balanceAfter: balance.quantity,
					inventoryItemId: reservation.inventoryItemId,
					orderId,
					quantity: number(reservation.quantity) * -1,
					reason: "Consumo do pedido",
					type: "consumption",
					unitCostCents: reservation.unitCostCents,
					unitId: reservation.unitId,
					userId,
				},
			});
		}
		await tx.inventoryReservation.updateMany({
			data: { status: "consumed" },
			where: { orderId, status: "reserved" },
		});
	}
}
