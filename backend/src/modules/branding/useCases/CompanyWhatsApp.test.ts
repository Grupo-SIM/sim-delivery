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

for (const slug of ["zero-grau", "other-company"]) {
	it(`automatically restarts only Zero Grau company sessions: ${slug}`, async () => {
		const saved = { companyId: "company_1", sessionName: "company", lastStatus: "FAILED", lastError: null, connectedPhone: null, lastSyncedAt: null };
		const prisma = {
			company: { findUniqueOrThrow: mock(async () => ({ slug })) },
			companyWhatsAppConnection: {
				findUnique: mock(async () => saved),
				update: mock(async ({ data }: { data: Record<string, unknown> }) => ({ ...saved, ...data })),
			},
		} as unknown as PrismaInstance;
		const waha = {
			getSession: mock(async () => ({ name: "company", status: "FAILED" })),
			restartSession: mock(async () => ({ name: "company", status: "STARTING" })),
		};
		const service = new CompanyWhatsApp(prisma, () => waha as unknown as WahaClient);
		expect((await service.get("company_1")).status).toBe(slug === "zero-grau" ? "STARTING" : "FAILED");
		await service.get("company_1");
		expect(waha.restartSession).toHaveBeenCalledTimes(slug === "zero-grau" ? 1 : 0);
	});
}
