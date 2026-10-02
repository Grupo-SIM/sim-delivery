import { describe, expect, it, mock } from "bun:test";
import type { PrismaInstance } from "@/shared/infra/sql";
import { WahaRequestError, WahaClient, type WahaSessionInfo } from "@/shared/infra/whatsapp";
import { buildUnitWhatsAppSessionName, UnitWhatsApp } from "./UnitWhatsApp";

function connection(sessionName = "sim-delivery_acme_centro") {
	return {
		companyId: "company_1",
		connectedPhone: null,
		createdAt: new Date("2026-09-15T00:00:00Z"),
		id: "connection_1",
		lastError: null as string | null,
		lastStatus: null,
		lastSyncedAt: null,
		sessionName,
		unitId: "unit_1",
		updatedAt: new Date("2026-09-15T00:00:00Z"),
	};
}

function world(saved = connection()) {
	const upsert = mock((_input: unknown) => Promise.resolve(saved));
	const update = mock((input: { data: Record<string, unknown> }) => Promise.resolve({ ...saved, ...input.data }));
	const prisma = {
		unit: {
			findFirst: mock(() =>
				Promise.resolve({ company: { slug: "acme" }, companyId: "company_1", id: "unit_1", slug: "centro" }),
			),
		},
		unitWhatsAppConnection: { findUnique: mock(() => Promise.resolve(saved)), update, upsert },
	} as unknown as PrismaInstance;
	const waha = {
		createSession: mock(() => Promise.resolve({ name: saved.sessionName, status: "STARTING" })),
		getSession: mock((_name: string): Promise<WahaSessionInfo> =>
			Promise.resolve({
				config: {
					metadata: {
						"sim-delivery.companyId": "company_1",
						"sim-delivery.unitId": "unit_1",
					},
				},
				me: { id: "5581999999999@c.us" },
				name: saved.sessionName,
				status: "WORKING",
				}),
			),
		updateSessionMetadata: mock(async (session: WahaSessionInfo, metadata: Record<string, string>): Promise<WahaSessionInfo> => ({ ...session, config: { ...session.config, metadata: { ...session.config?.metadata, ...metadata } } })),
		getQrDataUrl: mock(() => Promise.resolve("data:image/png;base64,AQID")),
		logoutSession: mock(() => Promise.resolve({ name: saved.sessionName, status: "STOPPED" })),
		restartSession: mock(() => Promise.resolve({ name: saved.sessionName, status: "STARTING" })),
		startSession: mock(() => Promise.resolve({ name: saved.sessionName, status: "STARTING" })),
	};
	return { prisma, service: new UnitWhatsApp(prisma, () => waha as unknown as WahaClient), update, upsert, waha };
}

describe("UnitWhatsApp", () => {
	it("restarts a failed session when reconnecting", async () => {
		const { service, waha } = world();
		waha.getSession.mockImplementation(async () => ({
			config: { metadata: { "sim-delivery.companyId": "company_1", "sim-delivery.unitId": "unit_1" } },
			me: { id: "5581999999999@c.us" },
			name: "sim-delivery_acme_centro",
			status: "FAILED",
		}));
		const result = await service.connect("company_1", "unit_1");
		expect(waha.restartSession).toHaveBeenCalledWith("sim-delivery_acme_centro");
		expect(result.status).toBe("STARTING");
		expect(result.lastError).toBeNull();
	});

	it("recovers a stored failed session without ownership metadata", async () => {
		const { service, waha } = world(connection("sim-delivery_acme_old-slug"));
		waha.getSession.mockImplementation(async () => ({ name: "sim-delivery_acme_old-slug", status: "FAILED" }));
		expect((await service.connect("company_1", "unit_1")).status).toBe("STARTING");
		expect(waha.restartSession).toHaveBeenCalledWith("sim-delivery_acme_old-slug");
	});

	it("does not claim an unbound session without metadata", async () => {
		const { service, prisma, waha } = world();
		(prisma.unitWhatsAppConnection.findUnique as ReturnType<typeof mock>).mockResolvedValue(null);
		waha.getSession.mockImplementation(async () => ({ name: "sim-delivery_acme_centro", status: "FAILED" }));
		await expect(service.connect("company_1", "unit_1")).rejects.toThrow("WHATSAPP_SESSION_CONFLICT");
		expect(waha.restartSession).not.toHaveBeenCalled();
	});

	it("rejects conflicting company metadata even with a stored binding", async () => {
		const { service, waha } = world();
		waha.getSession.mockImplementation(async () => ({ config: { metadata: { "sim-delivery.companyId": "other_company" } }, name: "sim-delivery_acme_centro", status: "FAILED" }));
		await expect(service.connect("company_1", "unit_1")).rejects.toThrow("WHATSAPP_SESSION_CONFLICT");
		expect(waha.restartSession).not.toHaveBeenCalled();
	});

	it("does not create an alternative session when an existing session has conflicting metadata", async () => {
		const { service, waha } = world();
		waha.getSession.mockImplementation(async name => ({ name, status: "FAILED", config: { metadata: { "sim-delivery.companyId": "company_1", "sim-delivery.unitId": "old_unit" } } }));
		await expect(service.connect("company_1", "unit_1")).rejects.toThrow("WHATSAPP_SESSION_CONFLICT");
		expect(waha.createSession).not.toHaveBeenCalled();
		expect(waha.getSession).toHaveBeenCalledTimes(1);
	});

	it("creates a session only when the exact stored session is absent", async () => {
		const { service, waha } = world();
		waha.getSession.mockRejectedValue(new WahaRequestError(404));
		expect((await service.connect("company_1", "unit_1")).status).toBe("STARTING");
		expect(waha.createSession).toHaveBeenCalledWith("sim-delivery_acme_centro", { "sim-delivery.companyId": "company_1", "sim-delivery.unitId": "unit_1" });
	});

	it("automatically recovers Zero Grau failures without restarting on every status poll", async () => {
		const { service, prisma, waha } = world();
		(prisma.unit.findFirst as ReturnType<typeof mock>).mockResolvedValue({ company: { slug: "zero-grau" }, companyId: "company_1", id: "unit_1", slug: "centro" });
		waha.getSession.mockImplementation(async name => ({ name, status: "FAILED", config: { metadata: { "sim-delivery.companyId": "company_1", "sim-delivery.unitId": "unit_1" } } }));
		expect((await service.get("company_1", "unit_1")).status).toBe("STARTING");
		await service.get("company_1", "unit_1");
		expect(waha.restartSession).toHaveBeenCalledTimes(1);
	});

	it("does not automatically restart failed sessions for another company", async () => {
		const { service, waha } = world();
		waha.getSession.mockImplementation(async name => ({ name, status: "FAILED" }));
		expect((await service.get("company_1", "unit_1")).status).toBe("FAILED");
		expect(waha.restartSession).not.toHaveBeenCalled();
	});

	it("rebinds and restarts the same failed Zero Grau session when its previous unit was deleted", async () => {
		const { service, prisma, waha } = world(connection("sim-delivery_zero-grau_centro"));
		(prisma.unit.findFirst as ReturnType<typeof mock>).mockImplementation(async ({ where }: { where: { id: string } }) => where.id === "old_unit" ? null : { company: { slug: "zero-grau" }, companyId: "company_1", id: "unit_1", slug: "centro" });
		waha.getSession.mockImplementation(async name => ({ name, status: "FAILED", config: { metadata: { "sim-delivery.companyId": "company_1", "sim-delivery.unitId": "old_unit" } } }));
		const result = await service.connect("company_1", "unit_1");
		expect(result.sessionName).toBe("sim-delivery_zero-grau_centro");
		expect(result.status).toBe("STARTING");
		expect(waha.updateSessionMetadata).toHaveBeenCalledTimes(1);
		expect(waha.updateSessionMetadata.mock.calls[0]?.[1]["sim-delivery.unitId"]).toBe("unit_1");
		expect(waha.restartSession).toHaveBeenCalledWith("sim-delivery_zero-grau_centro");
		expect(waha.createSession).not.toHaveBeenCalled();
	});

	it("does not rebind a failed Zero Grau session whose previous unit still exists", async () => {
		const { service, prisma, waha } = world(connection("sim-delivery_zero-grau_centro"));
		(prisma.unit.findFirst as ReturnType<typeof mock>).mockResolvedValue({ company: { slug: "zero-grau" }, companyId: "company_1", id: "unit_1", slug: "centro" });
		waha.getSession.mockImplementation(async name => ({ name, status: "FAILED", config: { metadata: { "sim-delivery.companyId": "company_1", "sim-delivery.unitId": "old_unit" } } }));
		await expect(service.connect("company_1", "unit_1")).rejects.toThrow("WHATSAPP_SESSION_CONFLICT");
		expect(waha.updateSessionMetadata).not.toHaveBeenCalled();
		expect(waha.createSession).not.toHaveBeenCalled();
		expect(waha.restartSession).not.toHaveBeenCalled();
	});

	for (const previousCompanyExists of [false, true]) {
		it(`only repairs old company metadata when its record was removed: ${previousCompanyExists}`, async () => {
			const { service, prisma, waha } = world(connection("sim-delivery_zero-grau_centro"));
			(prisma as unknown as { company: unknown }).company = { findUnique: mock(async () => previousCompanyExists ? { id: "old_company" } : null) };
			(prisma.unit.findFirst as ReturnType<typeof mock>).mockImplementation(async ({ where }: { where: { id: string } }) => where.id === "old_unit" ? null : { company: { slug: "zero-grau" }, companyId: "company_1", id: "unit_1", slug: "centro" });
			waha.getSession.mockImplementation(async name => ({ name, status: "FAILED", config: { metadata: { "sim-delivery.companyId": "old_company", "sim-delivery.unitId": "old_unit" } } }));
			if (previousCompanyExists) {
				await expect(service.connect("company_1", "unit_1")).rejects.toThrow("WHATSAPP_SESSION_CONFLICT");
				expect(waha.restartSession).not.toHaveBeenCalled();
			} else {
				expect((await service.connect("company_1", "unit_1")).status).toBe("STARTING");
				expect(waha.restartSession).toHaveBeenCalledWith("sim-delivery_zero-grau_centro");
			}
			expect(waha.createSession).not.toHaveBeenCalled();
		});
	}

	it("reports the failing WAHA operation when automatic recovery fails", async () => {
		const { service, prisma, waha } = world();
		(prisma.unit.findFirst as ReturnType<typeof mock>).mockResolvedValue({ company: { slug: "zero-grau" }, companyId: "company_1", id: "unit_1", slug: "centro" });
		waha.getSession.mockImplementation(async name => ({ name, status: "FAILED", config: { metadata: { "sim-delivery.companyId": "company_1", "sim-delivery.unitId": "unit_1" } } }));
		waha.restartSession.mockRejectedValue(new WahaRequestError(503, "POST /api/sessions/unit/restart"));
		const result = await service.get("company_1", "unit_1");
		expect(result.lastError).toBe("WAHA request failed (503): POST /api/sessions/unit/restart");
	});

	it("preserves a recovery error while subsequent status polls remain FAILED", async () => {
		const saved = { ...connection(), lastError: "WAHA restart failed" };
		const { service, waha } = world(saved);
		waha.getSession.mockImplementation(async name => ({ name, status: "FAILED" }));
		expect((await service.get("company_1", "unit_1")).lastError).toBe("WAHA restart failed");
	});

	it("automatic unit recovery calls the relevant unit restart URL, never the global session or session creation", async () => {
		const sessionName = "sim-delivery_zero-grau_tucuma";
		const saved = connection(sessionName);
		const { prisma } = world(saved);
		(prisma.unit.findFirst as ReturnType<typeof mock>).mockResolvedValue({ company: { slug: "zero-grau" }, companyId: "company_1", id: "unit_1", slug: "tucuma" });
		let restarted = false;
		const fetch = mock(async (input: string | URL | Request, init?: RequestInit) => {
			if (init?.method === "POST") {
				restarted = true;
				return new Response(null, { status: 204 });
			}
			return Response.json({ name: sessionName, status: restarted ? "STARTING" : "FAILED", config: { metadata: { "sim-delivery.companyId": "company_1", "sim-delivery.unitId": "unit_1" } } });
		});
		const service = new UnitWhatsApp(prisma, () => new WahaClient({ baseUrl: "https://waha.example", session: "global" }, fetch as never));
		const result = await service.get("company_1", "unit_1");
		expect(result.status).toBe("STARTING");
		expect(result.sessionName).toBe(sessionName);
		expect(fetch.mock.calls.filter(([, init]) => init?.method === "POST").map(([url]) => url)).toEqual(["https://waha.example/api/sessions/sim-delivery_zero-grau_tucuma/restart"]);
	});

	it("builds the deterministic WAHA session name", () => {
		expect(buildUnitWhatsAppSessionName("bliss-cookie", "shopping-recife")).toBe(
			"sim-delivery_bliss-cookie_shopping-recife",
		);
	});

	it("does not initialize WAHA while registering the use case", () => {
		const { prisma } = world();
		const createWahaClient = mock(() => ({}) as WahaClient);

		new UnitWhatsApp(prisma, createWahaClient);

		expect(createWahaClient).not.toHaveBeenCalled();
	});

	it("keeps the stored session name and synchronizes the connected phone", async () => {
		const saved = connection("sim-delivery_acme_old-slug");
		const { service, update, upsert, waha } = world(saved);

		const result = await service.connect("company_1", "unit_1");

		expect(waha.getSession).toHaveBeenCalledWith("sim-delivery_acme_old-slug");
		expect(upsert.mock.calls[0]?.[0]).toEqual(
			expect.objectContaining({ update: {}, where: { unitId: "unit_1" } }),
		);
		expect(update.mock.calls[0]?.[0]).toEqual(
			expect.objectContaining({
				data: expect.objectContaining({ connectedPhone: "+5581999999999", lastStatus: "WORKING" }),
			}),
		);
		expect(result.connectedPhone).toBe("+5581999999999");
	});

	it("rejects a pre-existing WAHA session owned by another unit", async () => {
		const { service, waha } = world();
		waha.getSession.mockImplementation(() =>
			Promise.resolve({
				config: {
					metadata: {
						"sim-delivery.companyId": "company_1",
						"sim-delivery.unitId": "unit_other",
					},
				},
				me: { id: "5581999999999@c.us" },
				name: "sim-delivery_acme_centro",
				status: "WORKING",
			}),
		);

		await expect(service.connect("company_1", "unit_1")).rejects.toThrow("WHATSAPP_SESSION_CONFLICT");
	});
});
