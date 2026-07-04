import { describe, expect, it, mock } from "bun:test";
import { ConsoleWhatsAppProvider } from "./ConsoleWhatsAppProvider";
import { DisabledWhatsAppProvider } from "./DisabledWhatsAppProvider";

describe("ConsoleWhatsAppProvider", () => {
	it("logs to console without throwing", async () => {
		const consoleSpy = mock(() => {});
		const original = console.log;
		console.log = consoleSpy;

		const provider = new ConsoleWhatsAppProvider();
		await provider.sendOrderStatus("5511999999999", "em_preparo", "ord_1");

		console.log = original;
		expect(consoleSpy).toHaveBeenCalledTimes(1);
	});
});

describe("DisabledWhatsAppProvider", () => {
	it("resolves without doing anything", async () => {
		const provider = new DisabledWhatsAppProvider();
		await expect(provider.sendOrderStatus("5511999999999", "em_preparo", "ord_1")).resolves.toBeUndefined();
	});
});
