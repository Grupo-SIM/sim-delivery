import { beforeEach, describe, expect, it, mock } from "bun:test";
import type { PrismaInstance } from "@/shared/infra/sql";
import type { WahaClient } from "./WahaClient";
import { WhatsAppSessionWatchdog } from "./WhatsAppSessionWatchdog";

function setup(status: string) {
	const update = mock(async () => ({}));
	const prisma = {
		company: {
			findUnique: mock(async () => ({
				id: "company_1",
				unitWhatsAppConnections: [],
				whatsAppConnection: { sessionName: "sim-delivery_acme" },
			})),
		},
		companyWhatsAppConnection: { update },
		user: { findFirst: mock(async () => ({ email: "owner@acme.com", name: "Dono" })) },
	} as unknown as PrismaInstance;
	const waha = {
		getSession: mock(async () => ({ name: "sim-delivery_acme", status })),
		restartSession: mock(async () => ({ name: "sim-delivery_acme", status: "STARTING" })),
		startSession: mock(async () => ({ name: "sim-delivery_acme", status: "STARTING" })),
	};
	const notify = mock(async () => {});
	const watchdog = new WhatsAppSessionWatchdog(prisma, waha as unknown as WahaClient, notify);
	return { notify, update, waha, watchdog };
}

describe("WhatsAppSessionWatchdog", () => {
	beforeEach(() => {
		process.env.COMPANY_SLUG = "acme";
	});

	it("restarts a failed session and records the new status", async () => {
		const { update, waha, watchdog } = setup("FAILED");
		await watchdog.execute(new Date("2026-11-12T10:00:00Z"));
		expect(waha.restartSession).toHaveBeenCalledWith("sim-delivery_acme");
		expect(update).toHaveBeenCalledTimes(1);
	});

	it("backs off between restart attempts", async () => {
		const { waha, watchdog } = setup("FAILED");
		await watchdog.execute(new Date("2026-11-12T10:00:00Z"));
		await watchdog.execute(new Date("2026-11-12T10:00:10Z"));
		expect(waha.restartSession).toHaveBeenCalledTimes(1);
		await watchdog.execute(new Date("2026-11-12T10:01:00Z"));
		expect(waha.restartSession).toHaveBeenCalledTimes(2);
	});

	it("starts a stopped session", async () => {
		const { waha, watchdog } = setup("STOPPED");
		await watchdog.execute(new Date("2026-11-12T10:00:00Z"));
		expect(waha.startSession).toHaveBeenCalledTimes(1);
	});

	it("e-mails the owner once per cooldown when a QR Code scan is needed", async () => {
		const { notify, waha, watchdog } = setup("SCAN_QR_CODE");
		await watchdog.execute(new Date("2026-11-12T10:00:00Z"));
		await watchdog.execute(new Date("2026-11-12T10:05:00Z"));
		expect(waha.restartSession).not.toHaveBeenCalled();
		expect(notify).toHaveBeenCalledTimes(1);
		await watchdog.execute(new Date("2026-11-12T17:00:00Z"));
		expect(notify).toHaveBeenCalledTimes(2);
	});

	it("does nothing to a working session", async () => {
		const { notify, waha, watchdog } = setup("WORKING");
		await watchdog.execute(new Date("2026-11-12T10:00:00Z"));
		expect(waha.restartSession).not.toHaveBeenCalled();
		expect(notify).not.toHaveBeenCalled();
	});
});
