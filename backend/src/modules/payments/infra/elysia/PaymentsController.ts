import Elysia, { t } from "elysia";
import { AuthGuard } from "@/modules/users/guards";
import { GlobalPlugin } from "@/shared/infra/elysia/global";
import { CreatePaymentIntentBody, PaymentIntentReturn, WebhookBody } from "../../dtos";
import { ConfirmPayment, CreatePaymentIntent } from "../../useCases";

const backendUrl = process.env.BACKEND_URL ?? "http://localhost:3000";

export const PaymentsController = new Elysia({ detail: { tags: ["Payments"] } })
	.use([GlobalPlugin])
	.group("/payments", app =>
		app
			.decorate(({ prisma, ...injected }) => ({
				...injected,
				confirmPayment: new ConfirmPayment(prisma),
				createPaymentIntent: new CreatePaymentIntent(prisma, backendUrl),
				prisma,
			}))
			.post(
				"/intent",
				async ({ body, createPaymentIntent, request }) => {
					const { userId } = await AuthGuard.execute(request.headers);
					return createPaymentIntent.execute(userId, body);
				},
				{ body: CreatePaymentIntentBody, response: PaymentIntentReturn },
			)
			.post(
				"/webhook",
				async ({ body, confirmPayment }) => {
					await confirmPayment.execute(body.token);
					return new Response(null, { status: 204 });
				},
				{ body: WebhookBody },
			),
	)
	.group("/pay", app =>
		app
			.decorate(({ prisma, ...injected }) => ({
				...injected,
				confirmPayment: new ConfirmPayment(prisma),
				prisma,
			}))
			.get(
				"/:token",
				async ({ params, prisma }) => {
					const payment = await prisma.payment.findUnique({
						include: { order: { include: { items: true } } },
						where: { token: params.token },
					});

					if (payment?.status !== "pending") {
						return new Response(
							"<!DOCTYPE html><html><body><p>Payment not found or already processed.</p></body></html>",
							{ headers: { "Content-Type": "text/html" } },
						);
					}

					const fmt = (cents: number) =>
						new Intl.NumberFormat("pt-BR", { currency: "BRL", style: "currency" }).format(cents / 100);

					const itemsHtml = payment.order.items
						.map(i => `<li>${i.quantity}× ${i.productName} — ${fmt(i.total)}</li>`)
						.join("");

					return new Response(
						`<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Pagamento</title>
  <style>
    body { font-family: sans-serif; max-width: 400px; margin: 40px auto; padding: 0 16px; }
    ul { padding-left: 20px; }
    .total { font-weight: bold; font-size: 1.2rem; margin: 16px 0; }
    button { background: #16a34a; color: white; border: none; padding: 12px 24px; font-size: 1rem; border-radius: 6px; cursor: pointer; width: 100%; }
    button:disabled { opacity: 0.5; cursor: not-allowed; }
    .msg { margin-top: 12px; text-align: center; }
  </style>
</head>
<body>
  <h2>Confirmar pagamento</h2>
  <ul>${itemsHtml}</ul>
  <p class="total">Total: ${fmt(payment.amount)}</p>
  <button id="btn" onclick="pay()">Pagar agora</button>
  <p class="msg" id="msg"></p>
  <script>
    async function pay() {
      const btn = document.getElementById('btn');
      const msg = document.getElementById('msg');
      btn.disabled = true;
      btn.textContent = 'Processando…';
      try {
        const res = await fetch(location.href, { method: 'POST' });
        if (res.ok) {
          btn.textContent = 'Pago!';
          msg.textContent = 'Pagamento confirmado. Redirecionando…';
          window.parent.postMessage({ type: 'payment_confirmed' }, '*');
        } else {
          throw new Error('failed');
        }
      } catch {
        btn.disabled = false;
        btn.textContent = 'Pagar agora';
        msg.textContent = 'Erro ao processar pagamento. Tente novamente.';
      }
    }
  </script>
</body>
</html>`,
						{ headers: { "Content-Type": "text/html" } },
					);
				},
				{ params: t.Object({ token: t.String() }) },
			)
			.post(
				"/:token",
				async ({ confirmPayment, params }) => {
					await confirmPayment.execute(params.token);
					return new Response(null, { status: 204 });
				},
				{ detail: { tags: ["Payments"] }, params: t.Object({ token: t.String() }) },
			),
	);
