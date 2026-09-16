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
		companyId: "company_1",
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
		sessionName: null,
		status: "pending",
		updatedAt: new Date("2026-09-14T10:00:00Z"),
		unitId: "unit_1",
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
	it("uses the unit session when it is working", async () => {
		const sendMessage = mock(() => Promise.resolve());
		const { prisma, provider } = world(sendMessage, notification({ sessionName: "sim-delivery_acme_centro" }));
		provider.getSessionStatus = mock(() => Promise.resolve("WORKING"));

		await new ProcessWhatsAppOutbox(prisma, provider).execute(new Date("2026-09-14T10:01:00Z"));

		expect(sendMessage).toHaveBeenCalledWith(
			"5581999999999",
			{ attachments: [], text: "Pedido pronto" },
			"sim-delivery_acme_centro",
		);
	});

	it("falls back to the global session when the unit session is stopped", async () => {
		const sendMessage = mock(() => Promise.resolve());
		const { prisma, provider } = world(sendMessage, notification({ sessionName: "sim-delivery_acme_centro" }));
		provider.getSessionStatus = mock(() => Promise.resolve("STOPPED"));

		await new ProcessWhatsAppOutbox(prisma, provider).execute(new Date("2026-09-14T10:01:00Z"));

		expect(sendMessage).toHaveBeenCalledWith(
			"5581999999999",
			{ attachments: [], text: "Pedido pronto" },
			undefined,
		);
	});

	it("retries instead of falling back when status lookup has a transient failure", async () => {
		const log = spyOn(console, "error").mockImplementation(() => {});
		const sendMessage = mock(() => Promise.resolve());
		const { prisma, provider, updates } = world(
			sendMessage,
			notification({ sessionName: "sim-delivery_acme_centro" }),
		);
		provider.getSessionStatus = mock(() => Promise.reject(new Error("WAHA request failed (503)")));

		await new ProcessWhatsAppOutbox(prisma, provider).execute(new Date("2026-09-14T10:01:00Z"));

		expect(sendMessage).not.toHaveBeenCalled();
		expect(updates[1]).toEqual(expect.objectContaining({ data: expect.objectContaining({ status: "pending" }) }));
		log.mockRestore();
	});

	it("claims and marks a delivered notification as sent", async () => {
		const sendMessage = mock(() => Promise.resolve());
		const { prisma, provider, updates } = world(sendMessage);

		expect(await new ProcessWhatsAppOutbox(prisma, provider).execute(new Date("2026-09-14T10:01:00Z"))).toBe(1);
		expect(sendMessage).toHaveBeenCalledWith("5581999999999", { attachments: [], text: "Pedido pronto" }, undefined);
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

		expect(sendMessage).toHaveBeenCalledWith(
			"5581999999999",
			{ attachments: [attachment], text: "Pedido pronto" },
			undefined,
		);
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
