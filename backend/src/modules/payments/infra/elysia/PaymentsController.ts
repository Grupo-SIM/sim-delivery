import { timingSafeEqual } from "node:crypto";
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
import { paymentStatusEvents } from "../PaymentStatusEvents";

const encoder = new TextEncoder();
const sseHeaders = {
	"Cache-Control": "no-cache, no-transform",
	Connection: "keep-alive",
	"Content-Type": "text/event-stream",
	"X-Accel-Buffering": "no",
};

function isValidWebhookSecret(value: string | null): boolean {
	const secret = process.env.SIMPAY_WEBHOOK_SECRET;
	if (!secret || !value) return false;

	const expected = Buffer.from(secret);
	const received = Buffer.from(value);
	return expected.length === received.length && timingSafeEqual(expected, received);
}

function paymentStatusEvent(status: string): Uint8Array {
	return encoder.encode(`event: payment-status\ndata: ${JSON.stringify({ status })}\n\n`);
}

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
					const { userId } = await AuthGuard.execute(request.headers);
					return getPaymentStatus.execute(userId, params.token);
				},
				{ params: t.Object({ token: t.String() }), response: PaymentStatusReturn },
			)
			.get("/status/:token/events", async ({ getPaymentStatus, params, request }) => {
				const { userId } = await AuthGuard.execute(request.headers);
				// Authorize before opening a long-lived response. The stream then reads the
				// persisted status once more after subscribing to avoid a missed webhook.
				await getPaymentStatus.execute(userId, params.token);

				let close = () => undefined;
				const stream = new ReadableStream<Uint8Array>({
					cancel: () => close(),
					start(controller) {
						let closed = false;
						const send = (status: string) => {
							if (!closed) controller.enqueue(paymentStatusEvent(status));
						};
						const unsubscribe = paymentStatusEvents.subscribe(params.token, send);
						const heartbeat = setInterval(() => {
							if (!closed) controller.enqueue(encoder.encode(": keepalive\n\n"));
						}, 25_000);
						const onAbort = () => close();

						close = () => {
							if (closed) return;
							closed = true;
							clearInterval(heartbeat);
							unsubscribe();
							request.signal.removeEventListener("abort", onAbort);
							controller.close();
						};

						request.signal.addEventListener("abort", onAbort, { once: true });
						void getPaymentStatus.execute(userId, params.token).then(status => send(status.status));
					},
				});

				return new Response(stream, { headers: sseHeaders });
			})
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
				async ({ body, confirmPayment, request, set }) => {
					if (!isValidWebhookSecret(request.headers.get("x-simpay-webhook-secret"))) {
						set.status = 401;
						return { error: "UNAUTHORIZED" };
					}

					const confirmed = await confirmPayment.execute(body.token);
					if (confirmed) paymentStatusEvents.publish(body.token, "confirmed");
					return new Response(null, { status: 204 });
				},
				{ body: WebhookBody, response: { 401: PaymentErrorReturn } },
			),
	);
