import Elysia from "elysia";
import { AuthGuard } from "@/modules/users/guards";
import { GlobalPlugin } from "@/shared/infra/elysia/global";
import { GetLoyaltyQuery, LoyaltyBalanceReturn } from "../../dtos";
import { GetLoyaltyBalance } from "../../useCases";

export const LoyaltyController = new Elysia({ detail: { tags: ["Loyalty"] } })
	.use([GlobalPlugin])
	.group("/loyalty", app =>
		app
			.decorate(({ prisma, ...injected }) => ({
				...injected,
				getLoyaltyBalance: new GetLoyaltyBalance(prisma),
				prisma,
			}))
			.get(
				"/me",
				async ({ getLoyaltyBalance, query, request }) => {
					const { userId } = await AuthGuard.execute(request.headers);
					return getLoyaltyBalance.execute(userId, query.variantKey);
				},
				{ query: GetLoyaltyQuery, response: LoyaltyBalanceReturn },
			),
	);
