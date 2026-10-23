import { afterEach, describe, expect, it } from "bun:test";
import type { PrismaInstance } from "@/shared/infra/sql";
import { UpdateNotificationPreferences } from "./UpdateNotificationPreferences";

const previousSlug = process.env.COMPANY_SLUG;
afterEach(() => {
	if (previousSlug === undefined) delete process.env.COMPANY_SLUG;
	else process.env.COMPANY_SLUG = previousSlug;
});

function setup(connectedPhone: string | null = null, found = true) {
	let lookup: unknown;
	let update: unknown;
	const prisma = {
		customer: {
			findFirst: async (args: unknown) => {
				lookup = args;
				return found ? { id: "current_customer", company: { whatsAppConnection: { connectedPhone } } } : null;
			},
			update: async (args: unknown) => {
				update = args;
				return { id: "current_customer", addresses: [] };
			},
		},
	} as unknown as PrismaInstance;
	return { prisma, lookup: () => lookup, update: () => update };
}

describe("UpdateNotificationPreferences", () => {
	it("updates only the current company's customer", async () => {
		process.env.COMPANY_SLUG = "current-company";
		const state = setup("5581999999999");
		await new UpdateNotificationPreferences(state.prisma).execute("user_1", { email: false, whatsApp: true });
		expect(state.lookup()).toMatchObject({ where: { company: { slug: "current-company" }, userId: "user_1" } });
		expect(state.update()).toMatchObject({ where: { id: "current_customer" }, data: { notificationEmail: false, notificationWhatsApp: true } });
	});

	it("disables WhatsApp when the company has no connected number", async () => {
		process.env.COMPANY_SLUG = "current-company";
		const state = setup();
		await new UpdateNotificationPreferences(state.prisma).execute("user_1", { email: true, whatsApp: true });
		expect(state.update()).toMatchObject({ data: { notificationWhatsApp: false } });
	});

	it("rejects a customer missing from the current company without updating another", async () => {
		process.env.COMPANY_SLUG = "current-company";
		const state = setup(null, false);
		await expect(new UpdateNotificationPreferences(state.prisma).execute("user_1", { email: true, whatsApp: true })).rejects.toThrow("CUSTOMER_NOT_FOUND");
		expect(state.update()).toBeUndefined();
	});

	it("rejects a missing tenant before querying customers", async () => {
		delete process.env.COMPANY_SLUG;
		const state = setup();
		await expect(new UpdateNotificationPreferences(state.prisma).execute("user_1", { email: true, whatsApp: true })).rejects.toThrow("COMPANY_NOT_FOUND");
		expect(state.lookup()).toBeUndefined();
	});
});
