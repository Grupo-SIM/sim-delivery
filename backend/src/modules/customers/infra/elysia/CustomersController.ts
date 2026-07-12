import Elysia from "elysia";
import { AuthGuard } from "@/modules/users/guards";
import { GlobalPlugin } from "@/shared/infra/elysia/global";
import { CreateCustomerBody, CustomerReturn, GetMyCustomerQuery, MaybeCustomerReturn } from "../../dtos";
import { GetMyCustomer, UpsertCustomer } from "../../useCases";

export const CustomersController = new Elysia({
	detail: { tags: ["Customers"] },
})
	.use([GlobalPlugin])
	.group("/customers", app =>
		app
			.decorate(({ prisma, ...injected }) => ({
				...injected,
				getMyCustomer: new GetMyCustomer(prisma),
				prisma,
				upsertCustomer: new UpsertCustomer(prisma),
			}))
			.get(
				"/me",
				async ({ getMyCustomer, query, request }) => {
					const { userId } = await AuthGuard.execute(request.headers);
					return getMyCustomer.execute(userId, query.slug);
				},
				{ query: GetMyCustomerQuery, response: MaybeCustomerReturn },
			)
			.post(
				"/me",
				async ({ body, request, upsertCustomer }) => {
					const { userId } = await AuthGuard.execute(request.headers);
					return upsertCustomer.execute(userId, body);
				},
				{ body: CreateCustomerBody, response: CustomerReturn },
			),
	);
