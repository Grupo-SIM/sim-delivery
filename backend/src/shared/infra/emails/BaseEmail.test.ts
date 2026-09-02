import { beforeEach, describe, expect, it } from "bun:test";
import { type EmailTransport, MagicLinkEmail, OrderStatusEmail, ResetPasswordEmail } from ".";

function fakeTransport() {
	const messages: Record<string, unknown>[] = [];
	const transport: EmailTransport = {
		sendMail: async message => {
			messages.push(message);
		},
	};
	return { messages, transport };
}

describe("email classes", () => {
	beforeEach(() => {
		process.env.MAIL_FROM = "notifications@example.com";
	});

	it("centralizes the sender and sends a reset-password email", async () => {
		const { messages, transport } = fakeTransport();

		const email = new ResetPasswordEmail({
			name: "Maria",
			to: "maria@example.com",
			url: "https://example.com/reset",
		});
		Object.defineProperty(email, "transport", { value: transport });
		await email.send();

		expect(messages[0]).toMatchObject({
			from: '"Zero Grau" <notifications@example.com>',
			subject: "Defina sua senha",
			to: "maria@example.com",
		});
		expect(messages[0]?.text).toContain("Maria");
		expect(messages[0]?.html).toContain("Definição de senha");
		expect(messages[0]?.html).toContain("Zero Grau");
	});

	it("builds magic-link and order-status payloads", async () => {
		const magic = fakeTransport();
		const status = fakeTransport();
		const magicEmail = new MagicLinkEmail({ to: "maria@example.com", url: "https://example.com/magic" });
		const statusEmail = new OrderStatusEmail({
			message: "Seu pedido foi cancelado.",
			orderNumber: 154,
			to: "maria@example.com",
		});
		const reviewEmail = new OrderStatusEmail({
			message: "Seu pedido #154 foi entregue. Bom apetite!",
			orderNumber: 154,
			reviewUrl: "https://example.com/centro/rate?orderId=order_1",
			to: "maria@example.com",
		});

		Object.defineProperty(magicEmail, "transport", { value: magic.transport });
		Object.defineProperty(statusEmail, "transport", { value: status.transport });
		Object.defineProperty(reviewEmail, "transport", { value: status.transport });
		await magicEmail.send();
		await statusEmail.send();
		await reviewEmail.send();

		expect(magic.messages[0]).toMatchObject({ subject: "Seu link de acesso", to: "maria@example.com" });
		expect(status.messages[0]).toMatchObject({
			subject: "Atualização do pedido #154",
			text: "Seu pedido foi cancelado.",
		});
		expect(status.messages[0]?.html).toContain("Atualização do pedido");
		expect(status.messages[0]?.html).not.toContain("Status:");
		expect(status.messages[0]?.html).toContain("Zero Grau");
		expect(status.messages[0]?.html).toContain("Todos os direitos reservados.");
		expect(status.messages[1]).toMatchObject({
			text: "Seu pedido foi entregue. Bom apetite!\n\nAvalie seu pedido: https://example.com/centro/rate?orderId=order_1",
		});
		expect(status.messages[1]?.html).toContain("Seu pedido foi entregue. Bom apetite!");
		expect(status.messages[1]?.html).not.toContain("Seu pedido #154 foi entregue.");
		expect(status.messages[1]?.html).toContain("Avaliar pedido");
		expect(status.messages[1]?.html).toContain("https://example.com/centro/rate?orderId=order_1");
	});
});
