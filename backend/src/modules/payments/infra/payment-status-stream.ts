interface PaymentStatusStreamOptions {
	readStatus: () => Promise<{ status: string }>;
	signal: AbortSignal;
	subscribe: (listener: (status: string) => void) => () => void;
}

const encoder = new TextEncoder();

/** Re-read persisted status so webhooks handled by another replica reach checkout. */
export function createPaymentStatusStream({ readStatus, signal, subscribe }: PaymentStatusStreamOptions) {
	let close = (_closeController = true) => {};
	return new ReadableStream<Uint8Array>({
		cancel: () => close(false),
		start(controller) {
			let closed = false;
			let reading = false;
			const send = (status: string) => {
				if (!closed) controller.enqueue(encoder.encode(`event: payment-status\ndata: ${JSON.stringify({ status })}\n\n`));
			};
			const unsubscribe = subscribe(send);
			const refresh = async () => {
				if (closed || reading) return;
				reading = true;
				try {
					const result = await readStatus();
					send(result.status);
				} catch (error) {
					console.error("[PaymentStatus] SSE persisted-status read failed", error);
				} finally {
					reading = false;
				}
			};
			const timer = setInterval(() => void refresh(), 5_000);
			const onAbort = () => close();
			close = (closeController = true) => {
				if (closed) return;
				closed = true;
				clearInterval(timer);
				unsubscribe();
				signal.removeEventListener("abort", onAbort);
				if (closeController) controller.close();
			};
			signal.addEventListener("abort", onAbort, { once: true });
			if (signal.aborted) close();
			else void refresh();
		},
	});
}
