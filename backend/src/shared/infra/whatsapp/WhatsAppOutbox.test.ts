import { describe, expect, it, mock, spyOn } from "bun:test";
import type { PrismaInstance } from "@/shared/infra/sql";
import type { WhatsAppProvider } from "./WhatsAppProvider";
import { ProcessWhatsAppOutbox } from "./WhatsAppOutbox";
import { InvalidWhatsAppPhoneError } from "./WahaClient";

function notification(overrides: Record<string, unknown> = {}) {
	return {
		attempts: 0,
		attachments: [],
		createdAt: new Date("2026-09-14T10:00:00Z"),
		deduplicationKey: "order-status:event_1",
		id: "notification_1",
		lastError: null,
		leaseUntil: null,
		message: "Pedido pronto",
		nextAttemptAt: new Date("2026-09-14T10:00:00Z"),
		orderId: "order_1",
		orderStatus: "pronto",
		recipient: "5581999999999",
		sentAt: null,
		status: "pending",
		updatedAt: new Date("2026-09-14T10:00:00Z"),
		...overrides,
	};
}

function world(sendMessage: WhatsAppProvider["sendMessage"], row = notification()) {
	const updates: unknown[] = [];
	let calls = 0;
	const prisma = {
		whatsAppNotification: {
			findMany: async () => [row],
			updateMany: async (input: unknown) => {
				updates.push(input);
				calls += 1;
				return { count: calls === 1 ? 1 : 1 };
			},
		},
	} as unknown as PrismaInstance;
	const provider = { deliveryMode: "outbox", sendMessage } as WhatsAppProvider;
	return { prisma, provider, updates };
}

describe("ProcessWhatsAppOutbox", () => {
	it("claims and marks a delivered notification as sent", async () => {
		const sendMessage = mock(() => Promise.resolve());
		const { prisma, provider, updates } = world(sendMessage);

		expect(await new ProcessWhatsAppOutbox(prisma, provider).execute(new Date("2026-09-14T10:01:00Z"))).toBe(1);
		expect(sendMessage).toHaveBeenCalledWith("5581999999999", { attachments: [], text: "Pedido pronto" });
		expect(updates).toHaveLength(2);
		expect(updates[1]).toEqual(expect.objectContaining({ data: expect.objectContaining({ status: "sent" }) }));
	});

	it("delivers frozen attachments with the message", async () => {
		const sendMessage = mock(() => Promise.resolve());
		const attachment = {
			filename: "pedido.pdf",
			mimeType: "application/pdf",
			url: "https://cdn.test/pedido.pdf",
		};
		const { prisma, provider } = world(sendMessage, notification({ attachments: [attachment] }));

		await new ProcessWhatsAppOutbox(prisma, provider).execute(new Date("2026-09-14T10:01:00Z"));

		expect(sendMessage).toHaveBeenCalledWith("5581999999999", {
			attachments: [attachment],
			text: "Pedido pronto",
		});
	});

	it("returns transient failures to pending with exponential backoff", async () => {
		const log = spyOn(console, "error").mockImplementation(() => {});
		const { prisma, provider, updates } = world(async () => {
			throw new Error("WAHA request failed (503)");
		});
		const now = new Date("2026-09-14T10:01:00Z");

		await new ProcessWhatsAppOutbox(prisma, provider).execute(now);

		expect(updates[1]).toEqual(
			expect.objectContaining({
				data: expect.objectContaining({ nextAttemptAt: new Date(now.getTime() + 30_000), status: "pending" }),
			}),
		);
		log.mockRestore();
	});

	it("marks invalid recipients as permanently failed", async () => {
		const log = spyOn(console, "error").mockImplementation(() => {});
		const { prisma, provider, updates } = world(async () => {
			throw new InvalidWhatsAppPhoneError();
		});

		await new ProcessWhatsAppOutbox(prisma, provider).execute(new Date("2026-09-14T10:01:00Z"));

		expect(updates[1]).toEqual(expect.objectContaining({ data: expect.objectContaining({ status: "failed" }) }));
		log.mockRestore();
	});
});
