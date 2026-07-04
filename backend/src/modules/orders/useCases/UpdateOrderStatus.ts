import { DomainError } from "@/shared/errors";
import type { PrismaInstance } from "@/shared/infra/sql";
import { UserErrors } from "@/modules/users/errors";
import type { WhatsAppProvider } from "@/shared/infra/whatsapp";
import type { UpdateOrderStatusBody, OrderReturn } from "../dtos";
import { OrderErrors } from "../errors";

const VALID_TRANSITIONS: Record<string, string[]> = {
	recebido: ["em_preparo", "cancelado"],
	em_preparo: ["pronto", "cancelado"],
	pronto: ["saiu_para_entrega", "retirado", "cancelado"],
	saiu_para_entrega: ["entregue", "cancelado"],
};

const NOTIFIABLE = new Set(["em_preparo", "saiu_para_entrega", "entregue", "retirado"]);

export class UpdateOrderStatus {
	constructor(
		private readonly prisma: PrismaInstance,
		private readonly whatsApp: WhatsAppProvider,
	) {}

	async execute(companyId: string | null, orderId: string, data: UpdateOrderStatusBody): Promise<OrderReturn> {
		if (!companyId) throw new DomainError(UserErrors.FORBIDDEN);
		const { status, cancelReason } = data;

		const order = await this.prisma.order.findFirst({
			include: { customer: true },
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

		if (NOTIFIABLE.has(status) && order.customer.phone) {
			await this.whatsApp.sendOrderStatus(order.customer.phone, status, orderId).catch(() => {});
		}

		return updated;
	}
}
