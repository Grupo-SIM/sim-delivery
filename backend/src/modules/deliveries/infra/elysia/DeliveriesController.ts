import Elysia from "elysia";
import { CompanyScopeGuard } from "@/modules/users/guards";
import { GlobalPlugin } from "@/shared/infra/elysia/global";
import { AssignDeliveryBody, DeliveryListReturn, DeliveryReturn, ListDeliveriesQuery, UpdateDeliveryStatusBody } from "../../dtos";
import { AssignDelivery, ListDeliveries, UpdateDeliveryStatus } from "../../useCases";

export const DeliveriesController = new Elysia({
	detail: { tags: ["Deliveries"] },
})
	.use([GlobalPlugin])
	.group("/deliveries", app =>
		app
			.decorate(({ prisma, ...injected }) => ({
				...injected,
				assignDelivery: new AssignDelivery(prisma),
				listDeliveries: new ListDeliveries(prisma),
				prisma,
				updateDeliveryStatus: new UpdateDeliveryStatus(prisma),
			}))
			.get(
				"/",
				async ({ listDeliveries, query, request }) => {
					const scope = await CompanyScopeGuard.execute(request.headers);
					CompanyScopeGuard.authorize(scope, "deliveries", "read");
					return listDeliveries.execute(scope.companyId, query);
				},
				{ query: ListDeliveriesQuery, response: DeliveryListReturn },
			)
			.post(
				"/",
				async ({ assignDelivery, body, request }) => {
					const scope = await CompanyScopeGuard.execute(request.headers);
					CompanyScopeGuard.authorize(scope, "deliveries", "assign");
					return assignDelivery.execute(scope.companyId, body);
				},
				{ body: AssignDeliveryBody, response: DeliveryReturn },
			)
			.patch(
				"/:deliveryId/status",
				async ({ body, params, request, updateDeliveryStatus }) => {
					const scope = await CompanyScopeGuard.execute(request.headers);
					CompanyScopeGuard.authorize(scope, "deliveries", "updateStatus");
					const isCourier = scope.role === "courier";
					return updateDeliveryStatus.execute(scope.companyId, scope.userId, params.deliveryId, body, isCourier);
				},
				{ body: UpdateDeliveryStatusBody, response: DeliveryReturn },
			),
	);
