import { describe, expect, it, mock } from "bun:test";
import type { PrismaInstance } from "@/shared/infra/sql";
import { WahaRequestError, type WahaClient, type WahaSessionInfo } from "@/shared/infra/whatsapp";
import { buildUnitWhatsAppSessionName, UnitWhatsApp } from "./UnitWhatsApp";

function connection(sessionName = "sim-delivery_acme_centro") {
	return {
		companyId: "company_1",
		connectedPhone: null,
		createdAt: new Date("2026-09-15T00:00:00Z"),
		id: "connection_1",
		lastError: null,
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

	it("pairs a new ID-specific session when a recreated unit reuses a slug", async () => {
		const { service, waha, update } = world();
		const uniqueName = "sim-delivery_acme_centro_unit_1";
		waha.getSession.mockImplementation(async name => {
			if (name === uniqueName) throw new WahaRequestError(404);
			return { name: "sim-delivery_acme_centro", status: "FAILED", config: { metadata: { "sim-delivery.companyId": "company_1", "sim-delivery.unitId": "old_unit" } } };
		});
		waha.createSession.mockImplementation(async () => ({ name: uniqueName, status: "STARTING" }));
		const result = await service.connect("company_1", "unit_1");
		expect(waha.createSession).toHaveBeenCalledWith(uniqueName, { "sim-delivery.companyId": "company_1", "sim-delivery.unitId": "unit_1" });
		expect(waha.restartSession).not.toHaveBeenCalled();
		expect(waha.logoutSession).not.toHaveBeenCalled();
		expect(result.sessionName).toBe(uniqueName);
		expect(result.status).toBe("STARTING");
		expect(update).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ sessionName: uniqueName }) }));
	});

	it("keeps the old binding when creation of the replacement fails", async () => {
		const { service, waha, update } = world();
		waha.getSession.mockImplementation(async name => {
			if (name.endsWith("_unit_1")) throw new WahaRequestError(404);
			return { name, status: "FAILED", config: { metadata: { "sim-delivery.unitId": "old_unit" } } };
		});
		waha.createSession.mockRejectedValue(new WahaRequestError(500));
		await expect(service.connect("company_1", "unit_1")).rejects.toThrow("WHATSAPP_UNAVAILABLE");
		expect(update.mock.calls[0]?.[0].data).not.toHaveProperty("sessionName");
	});

	it("reuses an owned replacement after a create conflict", async () => {
		const { service, waha } = world();
		let replacementReads = 0;
		waha.getSession.mockImplementation(async name => {
			if (!name.endsWith("_unit_1")) return { name, status: "FAILED", config: { metadata: { "sim-delivery.unitId": "old_unit" } } };
			if (++replacementReads === 1) throw new WahaRequestError(404);
			return { name, status: "SCAN_QR_CODE", config: { metadata: { "sim-delivery.companyId": "company_1", "sim-delivery.unitId": "unit_1" } } };
		});
		waha.createSession.mockRejectedValue(new WahaRequestError(409));
		expect((await service.connect("company_1", "unit_1")).sessionName).toBe("sim-delivery_acme_centro_unit_1");
		expect(waha.restartSession).not.toHaveBeenCalled();
	});

	it("rejects a replacement that also belongs to another unit", async () => {
		const { service, waha } = world();
		waha.getSession.mockImplementation(async name => ({ name, status: "FAILED", config: { metadata: { "sim-delivery.unitId": "old_unit" } } }));
		await expect(service.connect("company_1", "unit_1")).rejects.toThrow("WHATSAPP_SESSION_CONFLICT");
		expect(waha.restartSession).not.toHaveBeenCalled();
		expect(waha.createSession).not.toHaveBeenCalled();
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
