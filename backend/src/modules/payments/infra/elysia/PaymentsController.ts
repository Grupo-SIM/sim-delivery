import Elysia, { t } from "elysia";
import { AuthGuard, CompanyScopeGuard } from "@/modules/users/guards";
import { domPagamentos } from "@/shared/infra/domPagamentos";
import { GlobalPlugin } from "@/shared/infra/elysia/global";
import { simpay } from "@/shared/infra/simpay";
import {
	CardPaymentReturn,
	CreateCardPaymentBody,
	CreatePixPaymentBody,
	DeleteSavedCardReturn,
	ListSavedCardsQuery,
	PaymentErrorReturn,
	PaymentStatusReturn,
	PixPaymentReturn,
	RefundPaymentBody,
	RefundReturn,
	SavedCardsReturn,
	WebhookBody,
} from "../../dtos";
import {
	ConfirmPayment,
	CreateCardPayment,
	CreatePixPayment,
	DeleteSavedCard,
	GetPaymentStatus,
	ListSavedCards,
	RefundPayment,
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
				deleteSavedCard: new DeleteSavedCard(prisma),
				getPaymentStatus: new GetPaymentStatus(prisma, simpay),
				listSavedCards: new ListSavedCards(prisma),
				prisma,
				refundPayment: new RefundPayment(prisma, simpay),
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
				{
					body: CreateCardPaymentBody,
					response: {
						200: CardPaymentReturn,
						400: PaymentErrorReturn,
						401: PaymentErrorReturn,
						403: PaymentErrorReturn,
						404: PaymentErrorReturn,
						409: PaymentErrorReturn,
						422: PaymentErrorReturn,
					},
				},
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
			.delete(
				"/cards/:cardId",
				async ({ deleteSavedCard, params, query, request }) => {
					const { userId } = await AuthGuard.execute(request.headers);
					return deleteSavedCard.execute(userId, query.slug, params.cardId);
				},
				{
					params: t.Object({ cardId: t.String({ minLength: 1 }) }),
					query: ListSavedCardsQuery,
					response: {
						200: DeleteSavedCardReturn,
						404: PaymentErrorReturn,
					},
				},
			)
			.post(
				"/:orderId/refund",
				async ({ body, params, refundPayment, request }) => {
					const scope = await CompanyScopeGuard.execute(request.headers);
					CompanyScopeGuard.authorize(scope, "orders", "updateStatus");
					return refundPayment.execute(scope.companyId, params.orderId, body, scope.userId);
				},
				{
					body: RefundPaymentBody,
					params: t.Object({ orderId: t.String({ minLength: 1 }) }),
					response: RefundReturn,
				},
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
