import { describe, expect, mock, test } from "bun:test";
import { createPaymentStatusStream } from "./payment-status-stream";

const decoder = new TextDecoder();

describe("payment status SSE", () => {
	test("observes confirmation persisted by another replica without a local event", async () => {
		let status = "pending";
		const readStatus = mock(async () => ({ status }));
		const unsubscribe = mock(() => {});
		const abort = new AbortController();
		const stream = createPaymentStatusStream({ readStatus, signal: abort.signal, subscribe: () => unsubscribe });
		const reader = stream.getReader();
		try {
			expect(decoder.decode((await reader.read()).value)).toContain('"status":"pending"');
			status = "confirmed";
			expect(decoder.decode((await reader.read()).value)).toContain('"status":"confirmed"');
		} finally {
			abort.abort();
			await reader.cancel();
		}
		expect(unsubscribe).toHaveBeenCalledTimes(1);
	}, 7_000);

	test("sends same-process updates immediately and cleans up disconnected clients", async () => {
		let listener!: (status: string) => void;
		const unsubscribe = mock(() => {});
		const stream = createPaymentStatusStream({
			readStatus: async () => ({ status: "pending" }),
			signal: new AbortController().signal,
			subscribe: callback => { listener = callback; return unsubscribe; },
		});
		const reader = stream.getReader();
		await reader.read();
		listener("confirmed");
		expect(decoder.decode((await reader.read()).value)).toContain('"status":"confirmed"');
		await reader.cancel();
		listener("confirmed");
		expect(unsubscribe).toHaveBeenCalledTimes(1);
	});
});
