import type { PrismaInstance } from "@/shared/infra/sql";
import type { WhatsAppProvider } from "./WhatsAppProvider";
import { InvalidWhatsAppPhoneError } from "./WahaClient";

type OutboxClient = Pick<PrismaInstance, "whatsAppNotification">;

interface DispatchWhatsAppInput {
	deduplicationKey: string;
	message: string;
	orderId: string;
	orderStatus: string;
	phone: string;
	prisma: OutboxClient;
	provider: WhatsAppProvider;
}

export async function dispatchWhatsApp({
	deduplicationKey,
	message,
	orderId,
	orderStatus,
	phone,
	prisma,
	provider,
}: DispatchWhatsAppInput): Promise<void> {
	if (provider.deliveryMode === "outbox") {
		await prisma.whatsAppNotification.upsert({
			create: { deduplicationKey, message, orderId, orderStatus, recipient: phone },
			update: {},
			where: { deduplicationKey },
		});
		return;
	}

	try {
		await provider.sendText(phone, message);
	} catch (error) {
		console.error("Failed to send direct WhatsApp notification", error);
	}
}

const BATCH_SIZE = 20;
const INTERVAL_MS = 5_000;
const LEASE_MS = 30_000;
const INITIAL_RETRY_MS = 30_000;
const MAX_RETRY_MS = 60 * 60_000;

function retryDelay(attempt: number): number {
	return Math.min(INITIAL_RETRY_MS * 2 ** Math.max(0, attempt - 1), MAX_RETRY_MS);
}

function safeError(error: unknown): string {
	if (error instanceof Error) return `${error.name}: ${error.message}`.slice(0, 500);
	return "Unknown WhatsApp delivery error";
}

export class ProcessWhatsAppOutbox {
	constructor(
		private readonly prisma: PrismaInstance,
		private readonly provider: WhatsAppProvider,
	) {}

	async execute(now = new Date()): Promise<number> {
		if (this.provider.deliveryMode !== "outbox") return 0;
		const candidates = await this.prisma.whatsAppNotification.findMany({
			orderBy: { createdAt: "asc" },
			take: BATCH_SIZE,
			where: {
				OR: [
					{ nextAttemptAt: { lte: now }, status: "pending" },
					{ leaseUntil: { lt: now }, status: "processing" },
				],
			},
		});

		let processed = 0;
		for (const candidate of candidates) {
			const leaseUntil = new Date(now.getTime() + LEASE_MS);
			const claimed = await this.prisma.whatsAppNotification.updateMany({
				data: { attempts: { increment: 1 }, leaseUntil, status: "processing" },
				where: {
					id: candidate.id,
					OR: [
						{ nextAttemptAt: { lte: now }, status: "pending" },
						{ leaseUntil: { lt: now }, status: "processing" },
					],
				},
			});
			if (claimed.count === 0) continue;

			const attempt = candidate.attempts + 1;
			try {
				await this.provider.sendText(candidate.recipient, candidate.message);
				await this.prisma.whatsAppNotification.updateMany({
					data: { lastError: null, leaseUntil: null, sentAt: new Date(), status: "sent" },
					where: { id: candidate.id, leaseUntil, status: "processing" },
				});
			} catch (error) {
				const permanent = error instanceof InvalidWhatsAppPhoneError;
				await this.prisma.whatsAppNotification.updateMany({
					data: {
						lastError: safeError(error),
						leaseUntil: null,
						nextAttemptAt: permanent ? candidate.nextAttemptAt : new Date(now.getTime() + retryDelay(attempt)),
						status: permanent ? "failed" : "pending",
					},
					where: { id: candidate.id, leaseUntil, status: "processing" },
				});
				console.error(`Failed to deliver WhatsApp notification ${candidate.id}`, safeError(error));
			}
			processed += 1;
		}

		return processed;
	}
}

export function startWhatsAppOutboxWorker(
	prisma: PrismaInstance,
	provider: WhatsAppProvider,
): () => void {
	const processor = new ProcessWhatsAppOutbox(prisma, provider);
	let running = false;
	const run = async () => {
		if (running) return;
		running = true;
		try {
			await processor.execute();
		} catch (error) {
			console.error("Failed to process WhatsApp outbox", error);
		} finally {
			running = false;
		}
	};

	void run();
	const timer = setInterval(() => void run(), INTERVAL_MS);
	timer.unref();
	return () => clearInterval(timer);
}
