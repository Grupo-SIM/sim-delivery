import { InventoryLifecycle } from "@/modules/inventory/lifecycle";
import { UserErrors } from "@/modules/users/errors";
import { DomainError } from "@/shared/errors";
import type { PrismaInstance } from "@/shared/infra/sql";
import type { CloseOrdersDayReturn } from "../dtos";

const CANCELLATION_REASON = "Pedido não finalizado até o encerramento do expediente.";
const PENDING_STATUSES = ["recebido", "em_preparo", "pronto", "saiu_para_entrega", "problema"];

interface CloseOrdersScope {
	createdAfter?: Date;
	createdBefore?: Date;
	unitId?: string;
}

export class CloseOrdersDay {
	constructor(private readonly prisma: PrismaInstance) {}

	async closePendingOrders(companyId: string, scope: CloseOrdersScope = {}): Promise<number> {
		const orders = await this.prisma.order.findMany({
			select: { id: true },
			where: {
				companyId,
				...(scope.unitId ? { unitId: scope.unitId } : {}),
				...(scope.createdAfter || scope.createdBefore
					? {
						createdAt: {
							...(scope.createdAfter ? { gte: scope.createdAfter } : {}),
							...(scope.createdBefore ? { lt: scope.createdBefore } : {}),
						},
					}
					: {}),
				status: { in: PENDING_STATUSES },
			},
		});

		let cancelled = 0;
		for (const order of orders) {
			const changed = await this.prisma.$transaction(async tx => {
				const result = await tx.order.updateMany({
					data: { cancelReason: CANCELLATION_REASON, status: "cancelado" },
					where: { id: order.id, status: { in: PENDING_STATUSES } },
				});
				if (result.count === 0) return false;
				await InventoryLifecycle.release(tx, order.id);
				await tx.orderStatusEvent.create({ data: { orderId: order.id, status: "cancelado" } });
				return true;
			});
			if (changed) cancelled += 1;
		}

		return cancelled;
	}

	async execute(companyId: string | null): Promise<CloseOrdersDayReturn> {
		if (!companyId) throw new DomainError(UserErrors.FORBIDDEN);
		await this.closePendingOrders(companyId);
		const company = await this.prisma.company.update({
			data: { orderBoardStartedAt: new Date() },
			select: { orderBoardStartedAt: true },
			where: { id: companyId },
		});
		return { orderBoardStartedAt: company.orderBoardStartedAt!.toISOString() };
	}
}
