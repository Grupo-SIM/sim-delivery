import Elysia from "elysia";
import { AuthGuard } from "@/modules/users/guards";
import { GlobalPlugin } from "@/shared/infra/elysia/global";
import { CashbackBalanceReturn, GetCashbackQuery } from "../../dtos";
import { GetCashbackBalance } from "../../useCases";

export const CashbackController = new Elysia({ detail: { tags: ["Cashback"] } })
	.use([GlobalPlugin])
	.group("/cashback", app =>
		app
			.decorate(({ prisma, ...injected }) => ({
				...injected,
				getCashbackBalance: new GetCashbackBalance(prisma),
				prisma,
			}))
			.get(
				"/me",
				async ({ getCashbackBalance, query, request }) => {
					const { userId } = await AuthGuard.execute(request.headers);
					return getCashbackBalance.execute(userId, query.variantKey);
				},
				{ query: GetCashbackQuery, response: CashbackBalanceReturn },
			),
	);
