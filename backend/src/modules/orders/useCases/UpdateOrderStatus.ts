import { DomainError } from "@/shared/errors";
import type { PrismaInstance } from "@/shared/infra/sql";
import type { UpdateOrderStatusBody, OrderReturn } from "../dtos";
import { OrderErrors } from "../errors";

const VALID_TRANSITIONS: Record<string, string[]> = {
	recebido: ["em_preparo", "cancelado"],
	em_preparo: ["pronto", "cancelado"],
	pronto: ["saiu_para_entrega", "retirado", "cancelado"],
	saiu_para_entrega: ["entregue", "cancelado"],
};

export class UpdateOrderStatus {
	constructor(private readonly prisma: PrismaInstance) {}

	async execute(companyId: string, orderId: string, data: UpdateOrderStatusBody): Promise<OrderReturn> {
		const { status, cancelReason } = data;

		const order = await this.prisma.order.findFirst({
			where: { companyId, id: orderId },
		});
		if (!order) throw new DomainError(OrderErrors.ORDER_NOT_FOUND);

		const allowed = VALID_TRANSITIONS[order.status];
		if (!allowed || !allowed.includes(status)) throw new DomainError(OrderErrors.INVALID_TRANSITION);
		if (status === "cancelado" && !cancelReason) throw new DomainError(OrderErrors.CANCEL_REASON_REQUIRED);

		const updated = await this.prisma.order.update({
			data: {
				cancelReason: status === "cancelado" ? cancelReason : null,
				status,
			},
			include: { items: true },
			where: { id: orderId },
		});

		return updated;
	}
}
