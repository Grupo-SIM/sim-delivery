import { DomainError } from "@/shared/errors";
import type { PrismaInstance } from "@/shared/infra/sql";
import type { DeliveryReturn, UpdateDeliveryStatusBody } from "../dtos";
import { DeliveryErrors } from "../errors";

const VALID_TRANSITIONS: Record<string, string[]> = {
	a_caminho: ["entregue", "falhou"],
	aceita: ["a_caminho", "recusada"],
	atribuida: ["aceita", "recusada"],
};

const ORDER_STATUS_MAP: Record<string, string> = {
	a_caminho: "saiu_para_entrega",
	entregue: "entregue",
};

export class UpdateDeliveryStatus {
	constructor(private readonly prisma: PrismaInstance) {}

	async execute(
		companyId: string | null,
		userId: string,
		deliveryId: string,
		data: UpdateDeliveryStatusBody,
		isCourier: boolean,
	): Promise<DeliveryReturn> {
		const { status } = data;

		const delivery = await this.prisma.delivery.findFirst({
			where: { ...(companyId ? { companyId } : {}), id: deliveryId },
		});
		if (!delivery) throw new DomainError(DeliveryErrors.DELIVERY_NOT_FOUND);

		if (isCourier && delivery.courierId !== userId) throw new DomainError(DeliveryErrors.FORBIDDEN_COURIER);

		const allowed = VALID_TRANSITIONS[delivery.status];
		if (!allowed?.includes(status)) throw new DomainError(DeliveryErrors.INVALID_TRANSITION);

		const now = new Date();
		const timestamps: Record<string, Date> = {};
		if (status === "aceita") timestamps.acceptedAt = now;
		if (status === "a_caminho") timestamps.departedAt = now;
		if (status === "entregue") timestamps.deliveredAt = now;

		const [updated] = await this.prisma.$transaction([
			this.prisma.delivery.update({
				data: { status, ...timestamps },
				where: { id: deliveryId },
			}),
			...(ORDER_STATUS_MAP[status]
				? [
						this.prisma.order.update({
							data: { status: ORDER_STATUS_MAP[status] },
							where: { id: delivery.orderId },
						}),
					]
				: []),
		]);

		return updated;
	}
}
