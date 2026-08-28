import { DomainError } from "@/shared/errors";
import type { PrismaInstance } from "@/shared/infra/sql";
import type { AssignDeliveryBody, DeliveryReturn } from "../dtos";
import { DeliveryErrors } from "../errors";

export class AssignDelivery {
	constructor(private readonly prisma: PrismaInstance) {}

	async execute(companyId: string | null, data: AssignDeliveryBody): Promise<DeliveryReturn> {
		const { courierId, orderId } = data;

		const order = await this.prisma.order.findFirst({
			where: { ...(companyId ? { companyId } : {}), id: orderId },
		});
		if (!order) throw new DomainError(DeliveryErrors.ORDER_NOT_FOUND);
		if (order.deliveryMethod !== "delivery") throw new DomainError(DeliveryErrors.ORDER_NOT_DELIVERY);
		if (order.status !== "pronto") throw new DomainError(DeliveryErrors.INVALID_TRANSITION);

		const courier = await this.prisma.user.findFirst({
			where: { companyId: order.companyId, id: courierId, role: "courier" },
		});
		const courierUnit = courier
			? await this.prisma.staffUnit.findUnique({
					where: { userId_unitId: { unitId: order.unitId, userId: courierId } },
				})
			: null;
		if (!courierUnit) throw new DomainError(DeliveryErrors.COURIER_NOT_AVAILABLE);

		const existing = await this.prisma.delivery.findUnique({ where: { orderId } });
		if (existing) {
			return this.prisma.delivery.update({ data: { courierId }, where: { id: existing.id } });
		}

		const delivery = await this.prisma.delivery.create({
			data: {
				companyId: order.companyId,
				courierId,
				orderId,
				unitId: order.unitId,
			},
		});

		return delivery;
	}
}
