import { describe, expect, it, mock } from "bun:test";
import type { PrismaInstance } from "@/shared/infra/sql";
import type { WahaClient } from "@/shared/infra/whatsapp";
import { CompanyWhatsApp } from "./CompanyWhatsApp";

describe("CompanyWhatsApp", () => {
	it("restarts a failed session and clears the previous failure", async () => {
		const saved = {
			companyId: "company_1",
			connectedPhone: null,
			lastError: "Previous failure",
			lastStatus: "FAILED",
			lastSyncedAt: null,
			sessionName: "sim-delivery_acme",
		};
		const prisma = {
			company: { findUniqueOrThrow: mock(async () => ({ slug: "acme" })) },
			companyWhatsAppConnection: {
				upsert: mock(async () => saved),
				update: mock(async ({ data }: { data: Record<string, unknown> }) => ({ ...saved, ...data })),
			},
		} as unknown as PrismaInstance;
		const waha = {
			getSession: mock(async () => ({ name: saved.sessionName, status: "FAILED" })),
			restartSession: mock(async () => ({ name: saved.sessionName, status: "STARTING" })),
		};
		const service = new CompanyWhatsApp(prisma, () => waha as unknown as WahaClient);
		const result = await service.connect(saved.companyId);
		expect(waha.restartSession).toHaveBeenCalledWith(saved.sessionName);
		expect(result.status).toBe("STARTING");
		expect(result.lastError).toBeNull();
	});
});
