import { describe, expect, it, mock } from "bun:test";
import { ConsoleWhatsAppProvider } from "./ConsoleWhatsAppProvider";
import { DisabledWhatsAppProvider } from "./DisabledWhatsAppProvider";

describe("ConsoleWhatsAppProvider", () => {
	it("logs to console without throwing", async () => {
		const consoleSpy = mock(() => {});
		const original = console.log;
		console.log = consoleSpy;

		const provider = new ConsoleWhatsAppProvider();
		await provider.sendMessage("5511999999999", { text: "Pedido em preparo" });

		console.log = original;
		expect(consoleSpy).toHaveBeenCalledTimes(1);
	});
});

describe("DisabledWhatsAppProvider", () => {
	it("resolves without doing anything", async () => {
		const provider = new DisabledWhatsAppProvider();
		await expect(provider.sendMessage("5511999999999", { text: "Pedido em preparo" })).resolves.toBeUndefined();
	});
});
