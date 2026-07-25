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

		const courier = await this.prisma.user.findFirst({
			where: { companyId: order.companyId, id: courierId, role: "courier" },
		});
		const courierUnit = courier
			? await this.prisma.courierUnit.findUnique({
					where: { courierId_unitId: { courierId, unitId: order.unitId } },
				})
			: null;
		if (!courierUnit) throw new DomainError(DeliveryErrors.COURIER_NOT_AVAILABLE);

		const existing = await this.prisma.delivery.findUnique({ where: { orderId } });
		if (existing) throw new DomainError(DeliveryErrors.ORDER_ALREADY_ASSIGNED);

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
