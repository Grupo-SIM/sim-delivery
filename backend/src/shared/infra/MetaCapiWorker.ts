import { randomUUID } from "node:crypto";
import type { PrismaInstance } from "./sql";
import { decryptSimpaySecret } from "./simpay-secrets";

const leaseMs = 120_000;
const maxAgeMs = 7 * 24 * 60 * 60_000;
const maxAttempts = 60;
const concurrency = 5;
const maxBackoffMs = 5 * 60_000;

/** Payloads and credentials never enter logs or error messages. */
export class MetaCapiWorker {
	constructor(private readonly prisma: PrismaInstance, private readonly send: typeof fetch = fetch) {}

	async execute(now = new Date()): Promise<number> {
		await this.prisma.marketingEvent.updateMany({
			where: { sentAt: null, failedAt: null, eventTime: { lte: new Date(now.getTime() - maxAgeMs) } },
			data: { failedAt: now, lastError: "event_expired", payload: {} },
		});
		// Bound retention of matching identifiers, whether delivery succeeded or failed.
		await this.prisma.marketingEvent.updateMany({ where: { createdAt: { lt: new Date(now.getTime() - maxAgeMs) } }, data: { payload: {} } });
		await this.prisma.order.updateMany({ where: { createdAt: { lt: new Date(now.getTime() - maxAgeMs) } }, data: { marketingAttribution: {} } });
		const candidates = await this.prisma.marketingEvent.findMany({
			where: { company: { metaCapiToken: { not: null }, metaPixelId: { not: null } }, sentAt: null, failedAt: null, nextRetryAt: { lte: now }, OR: [{ lockedAt: null }, { lockedAt: { lt: new Date(now.getTime() - leaseMs) } }] },
			orderBy: { nextRetryAt: "asc" }, take: 25,
		});
		let delivered = 0;
		for (let i = 0; i < candidates.length; i += concurrency) {
			const results = await Promise.all(candidates.slice(i, i + concurrency).map(event => this.deliver(event, now)));
			delivered += results.filter(Boolean).length;
		}
		return delivered;
	}

	private async deliver(event: Awaited<ReturnType<PrismaInstance["marketingEvent"]["findMany"]>>[number], now: Date): Promise<boolean> {
		{
			const lockToken = randomUUID();
			const claim = await this.prisma.marketingEvent.updateMany({
				where: { id: event.id, attempts: event.attempts, nextRetryAt: { lte: now }, sentAt: null, failedAt: null, OR: [{ lockedAt: null }, { lockedAt: { lt: new Date(now.getTime() - leaseMs) } }] },
				data: { lockedAt: new Date(), lockToken, attempts: { increment: 1 } },
			});
			if (!claim.count) return false;
			let error = "transport_error";
			let permanent = false;
			let success = false;
			try {
				const company = await this.prisma.company.findUniqueOrThrow({ where: { id: event.companyId }, select: { metaPixelId: true, metaCapiToken: true } });
				if (!company.metaCapiToken || !company.metaPixelId || !/^\d+$/.test(company.metaPixelId)) {
					error = "configuration_missing";
				} else {
					const response = await this.send(`https://graph.facebook.com/v22.0/${company.metaPixelId}/events`, {
						method: "POST", signal: AbortSignal.timeout(15_000),
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify({ access_token: decryptSimpaySecret(company.metaCapiToken), data: [event.payload], ...(process.env.META_CAPI_TEST_EVENT_CODE ? { test_event_code: process.env.META_CAPI_TEST_EVENT_CODE } : {}) }),
					});
					const result = await response.json().catch(() => null) as { events_received?: number; error?: { code?: number; is_transient?: boolean } } | null;
					success = response.ok && result?.events_received === 1;
					permanent = !success && response.status >= 400 && response.status < 500 && response.status !== 429 && !result?.error?.is_transient;
					error = `meta_http_${response.status}${typeof result?.error?.code === "number" ? `_code_${result.error.code}` : ""}`;
				}
			} catch { /* Preserve only a non-sensitive failure category. */ }
			const attempts = event.attempts + 1;
			await this.prisma.marketingEvent.updateMany({
				where: { id: event.id, lockToken },
				data: success ? { sentAt: now, lockedAt: null, lockToken: null, lastError: null, payload: {} } : {
					lockedAt: null, lockToken: null, lastError: error,
					failedAt: permanent || attempts >= maxAttempts ? now : null,
					nextRetryAt: new Date(now.getTime() + Math.min(maxBackoffMs, 30_000 * 2 ** (attempts - 1)) + Math.floor(Math.random() * 10_000)),
				},
			});
			return success;
		}
	}
}

export function startMetaCapiWorker(prisma: PrismaInstance) {
	if (process.env.META_CAPI_ENABLED === "false") return;
	const worker = new MetaCapiWorker(prisma);
	let running = false;
	const run = async () => {
		if (running) return;
		running = true;
		try { await worker.execute(); } catch { console.error("Meta CAPI worker failed"); } finally { running = false; }
	};
	const timer = setInterval(() => void run(), 30_000);
	timer.unref();
	void run();
	return () => clearInterval(timer);
}
