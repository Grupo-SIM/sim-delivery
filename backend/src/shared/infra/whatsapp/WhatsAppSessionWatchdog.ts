import { WhatsAppReconnectEmail } from "../emails";
import type { PrismaInstance } from "@/shared/infra/sql";
import { WahaRequestError, type WahaClient, type WahaSessionInfo } from "./WahaClient";

const INTERVAL_MS = 60_000;
const INITIAL_RETRY_MS = 30_000;
const MAX_RETRY_MS = 60 * 60_000;
const MAX_ATTEMPTS = 5;
const NOTIFY_EVERY_MS = 6 * 60 * 60_000;

/** Statuses that only a human (scanning a QR Code or confirming a passkey) can fix. */
const REAUTH_STATUSES = new Set(["SCAN_QR_CODE", "PASSKEY_REQUIRED", "PASSKEY_CONFIRMATION_REQUIRED"]);
const RESTARTABLE_STATUSES = new Set(["FAILED", "STOPPED"]);

interface RetryState {
	attempts: number;
	nextAttemptAt: number;
}

interface Target {
	label: string;
	sessionName: string;
	save: (data: { lastError: string | null; lastStatus: string; lastSyncedAt: Date; connectedPhone?: string | null }) => Promise<unknown>;
}

type ReconnectNotifier = (input: { label: string; to: string; name: string }) => Promise<void>;

async function sendReconnectEmail({ label, name, to }: { label: string; name: string; to: string }) {
	await new WhatsAppReconnectEmail({ adminUrl: process.env.APP_URL ? `${process.env.APP_URL.replace(/\/$/, "")}/admin/company` : undefined, name, sessionLabel: label, to }).send();
}

function retryDelay(attempts: number): number {
	return Math.min(INITIAL_RETRY_MS * 2 ** Math.max(0, attempts - 1), MAX_RETRY_MS);
}

/**
 * Keeps the deployment company's WAHA sessions alive: restarts FAILED/STOPPED sessions with
 * backoff, and e-mails the company owner when a session needs a new QR Code.
 */
export class WhatsAppSessionWatchdog {
	private readonly retries = new Map<string, RetryState>();
	private readonly notifiedAt = new Map<string, number>();

	constructor(
		private readonly prisma: PrismaInstance,
		private readonly waha: WahaClient,
		private readonly notify: ReconnectNotifier = sendReconnectEmail,
	) {}

	async execute(now = new Date()): Promise<void> {
		const slug = process.env.COMPANY_SLUG?.trim();
		if (!slug) return;
		const company = await this.prisma.company.findUnique({
			select: {
				id: true,
				unitWhatsAppConnections: { select: { sessionName: true, unit: { select: { name: true } }, unitId: true } },
				whatsAppConnection: { select: { sessionName: true } },
			},
			where: { slug },
		});
		if (!company) return;

		const targets: Target[] = [];
		if (company.whatsAppConnection) {
			targets.push({
				label: "WhatsApp global",
				save: data => this.prisma.companyWhatsAppConnection.update({ data, where: { companyId: company.id } }),
				sessionName: company.whatsAppConnection.sessionName,
			});
		}
		for (const connection of company.unitWhatsAppConnections) {
			targets.push({
				label: `WhatsApp da unidade ${connection.unit.name}`,
				save: data => this.prisma.unitWhatsAppConnection.update({ data, where: { unitId: connection.unitId } }),
				sessionName: connection.sessionName,
			});
		}

		for (const target of targets) {
			try {
				await this.check(target, company.id, now);
			} catch (error) {
				console.error(`WhatsApp watchdog failed for ${target.sessionName}`, error instanceof Error ? error.message : error);
			}
		}
	}

	private async check(target: Target, companyId: string, now: Date): Promise<void> {
		let session: WahaSessionInfo;
		try {
			session = await this.waha.getSession(target.sessionName);
		} catch (error) {
			if (error instanceof WahaRequestError && error.status === 404) return;
			throw error;
		}

		if (session.status === "WORKING" || session.status === "STARTING") {
			this.retries.delete(target.sessionName);
			this.notifiedAt.delete(target.sessionName);
		} else if (REAUTH_STATUSES.has(session.status)) {
			await this.notifyOwner(target, companyId, now);
		} else if (RESTARTABLE_STATUSES.has(session.status)) {
			session = await this.tryRestart(target, session, now);
		}

		const digits = session.me?.id.split("@")[0]?.replace(/\D/g, "");
		await target.save({
			connectedPhone: digits ? `+${digits}` : null,
			lastError: null,
			lastStatus: session.status,
			lastSyncedAt: now,
		});
	}

	private async tryRestart(target: Target, session: WahaSessionInfo, now: Date): Promise<WahaSessionInfo> {
		const state = this.retries.get(target.sessionName) ?? { attempts: 0, nextAttemptAt: 0 };
		if (state.attempts >= MAX_ATTEMPTS || now.getTime() < state.nextAttemptAt) return session;
		const attempts = state.attempts + 1;
		this.retries.set(target.sessionName, { attempts, nextAttemptAt: now.getTime() + retryDelay(attempts) });
		try {
			return session.status === "STOPPED"
				? await this.waha.startSession(target.sessionName)
				: await this.waha.restartSession(target.sessionName);
		} catch (error) {
			console.error(`Failed to restart WhatsApp session ${target.sessionName} (attempt ${attempts})`, error instanceof Error ? error.message : error);
			return session;
		}
	}

	private async notifyOwner(target: Target, companyId: string, now: Date): Promise<void> {
		const last = this.notifiedAt.get(target.sessionName);
		if (last !== undefined && now.getTime() - last < NOTIFY_EVERY_MS) return;
		const owner = await this.prisma.user.findFirst({
			orderBy: { createdAt: "asc" },
			select: { email: true, name: true },
			where: { companyId, role: "owner" },
		});
		if (!owner) return;
		this.notifiedAt.set(target.sessionName, now.getTime());
		try {
			await this.notify({ label: target.label, name: owner.name, to: owner.email });
		} catch (error) {
			this.notifiedAt.delete(target.sessionName);
			console.error("Failed to e-mail WhatsApp reconnect notice", error instanceof Error ? error.message : error);
		}
	}
}

export function startWhatsAppSessionWatchdog(prisma: PrismaInstance, waha: WahaClient): () => void {
	const watchdog = new WhatsAppSessionWatchdog(prisma, waha);
	let running = false;
	const run = async () => {
		if (running) return;
		running = true;
		try {
			await watchdog.execute();
		} catch (error) {
			console.error("Failed to run WhatsApp session watchdog", error);
		} finally {
			running = false;
		}
	};
	void run();
	const timer = setInterval(() => void run(), INTERVAL_MS);
	timer.unref();
	return () => clearInterval(timer);
}
