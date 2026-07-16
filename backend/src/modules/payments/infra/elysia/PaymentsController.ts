import Elysia, { t } from "elysia";
import { AuthGuard } from "@/modules/users/guards";
import { domPagamentos } from "@/shared/infra/domPagamentos";
import { GlobalPlugin } from "@/shared/infra/elysia/global";
import { simpay } from "@/shared/infra/simpay";
import {
	CardPaymentReturn,
	CreateCardPaymentBody,
	CreatePixPaymentBody,
	ListSavedCardsQuery,
	PaymentStatusReturn,
	PixPaymentReturn,
	SavedCardsReturn,
	WebhookBody,
} from "../../dtos";
import {
	ConfirmPayment,
	CreateCardPayment,
	CreatePixPayment,
	GetPaymentStatus,
	ListSavedCards,
} from "../../useCases";

export const PaymentsController = new Elysia({ detail: { tags: ["Payments"] } })
	.use([GlobalPlugin])
	.group("/payments", app =>
		app
			.decorate(({ prisma, ...injected }) => ({
				...injected,
				confirmPayment: new ConfirmPayment(prisma),
				createCardPayment: new CreateCardPayment(prisma, simpay, domPagamentos),
				createPixPayment: new CreatePixPayment(prisma, simpay),
				getPaymentStatus: new GetPaymentStatus(prisma, simpay),
				listSavedCards: new ListSavedCards(prisma),
				prisma,
			}))
			.post(
				"/pix",
				async ({ body, createPixPayment, request }) => {
					const { userId } = await AuthGuard.execute(request.headers);
					return createPixPayment.execute(userId, body);
				},
				{ body: CreatePixPaymentBody, response: PixPaymentReturn },
			)
			.post(
				"/card",
				async ({ body, createCardPayment, request }) => {
					const { userId } = await AuthGuard.execute(request.headers);
					return createCardPayment.execute(userId, body);
				},
				{ body: CreateCardPaymentBody, response: CardPaymentReturn },
			)
			.get(
				"/status/:token",
				async ({ getPaymentStatus, params, request }) => {
					await AuthGuard.execute(request.headers);
					return getPaymentStatus.execute(params.token);
				},
				{ params: t.Object({ token: t.String() }), response: PaymentStatusReturn },
			)
			.get(
				"/cards",
				async ({ listSavedCards, query, request }) => {
					const { userId } = await AuthGuard.execute(request.headers);
					return listSavedCards.execute(userId, query.slug);
				},
				{ query: ListSavedCardsQuery, response: SavedCardsReturn },
			)
			.post(
				"/webhook",
				async ({ body, confirmPayment }) => {
					await confirmPayment.execute(body.token);
					return new Response(null, { status: 204 });
				},
				{ body: WebhookBody },
			),
	);
