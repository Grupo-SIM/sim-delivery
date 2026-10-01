import { expect, it } from "bun:test";
import { WhatsAppSessionRecovery } from "./WhatsAppSessionRecovery";

it("limits recovery to Zero Grau and retries each session after one minute", () => {
	let now = 0;
	const recovery = new WhatsAppSessionRecovery(() => now);
	expect(recovery.shouldRestart("other-company", "other")).toBe(false);
	expect(recovery.shouldRestart("zero-grau", "unit")).toBe(true);
	expect(recovery.shouldRestart("zero-grau", "unit")).toBe(false);
	expect(recovery.shouldRestart("zero-grau", "company")).toBe(true);
	now = 59_999;
	expect(recovery.shouldRestart("zero-grau", "unit")).toBe(false);
	now = 60_000;
	expect(recovery.shouldRestart("zero-grau", "unit")).toBe(true);
});
