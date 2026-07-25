import { beforeEach, describe, expect, it } from "bun:test";
import { MagicLinkEmail, OrderStatusEmail, ResetPasswordEmail, type EmailTransport } from ".";

function fakeTransport() {
	const messages: Array<Record<string, unknown>> = [];
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

		const email = new ResetPasswordEmail({ name: "Maria", to: "maria@example.com", url: "https://example.com/reset" });
		Object.defineProperty(email, "transport", { value: transport });
		await email.send();

		expect(messages[0]).toMatchObject({
			from: '"Template App" <notifications@example.com>',
			subject: "Defina sua senha",
			to: "maria@example.com",
		});
		expect(messages[0]?.text).toContain("Maria");
		expect(messages[0]?.html).toContain("Definição de senha");
	});

	it("builds magic-link and order-status payloads", async () => {
		const magic = fakeTransport();
		const status = fakeTransport();
		const magicEmail = new MagicLinkEmail({ to: "maria@example.com", url: "https://example.com/magic" });
		const statusEmail = new OrderStatusEmail({
			message: "Seu pedido foi cancelado.",
			orderId: "order_1",
			status: "cancelado",
			to: "maria@example.com",
		});

		Object.defineProperty(magicEmail, "transport", { value: magic.transport });
		Object.defineProperty(statusEmail, "transport", { value: status.transport });
		await magicEmail.send();
		await statusEmail.send();

		expect(magic.messages[0]).toMatchObject({ subject: "Seu link de acesso", to: "maria@example.com" });
		expect(status.messages[0]).toMatchObject({
			subject: "Atualização do pedido order_1",
			text: "Seu pedido foi cancelado.\n\nStatus: cancelado",
		});
	});
});
