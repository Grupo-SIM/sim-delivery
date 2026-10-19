import { describe, expect, it, spyOn } from "bun:test";
import { SimpayClient, isApprovedSimpayStatus, isFailedSimpayStatus, simpayIntegrationKey } from "./simpay";

describe("Simpay payment status", () => {
	it("accepts explicit approval statuses regardless of casing", () => {
		expect(isApprovedSimpayStatus(" completed ")).toBe(true);
		expect(isApprovedSimpayStatus("paid")).toBe(true);
		expect(isApprovedSimpayStatus("PENDING")).toBe(false);
	});

	it("recognizes terminal failure statuses", () => {
		expect(isFailedSimpayStatus("FAILED")).toBe(true);
		expect(isFailedSimpayStatus("not_authorized")).toBe(true);
		expect(isFailedSimpayStatus("PENDING")).toBe(false);
	});
});

describe("Simpay merchant scope", () => {
	it("isolates each company under its branded integration key", () => {
		expect(simpayIntegrationKey("zero-grau")).toBe("sim-delivery_zero-grau");
		expect(simpayIntegrationKey("acme-food")).toBe("sim-delivery_acme-food");
	});
});


describe("Simpay owner registration", () => {
	it("uses authenticated scoped endpoint and preserves optional CNPJ/password", async () => {
		const fetch = spyOn(globalThis, "fetch").mockResolvedValue(Response.json({ id: "merchant" }));
		try {
			const owner = { email: "owner@example.com", legalName: "Shop", password: "secret123", cnpj: null };
			expect(await new SimpayClient().provisionOwner({ externalMerchantId: "company", integrationKey: "sim-delivery_shop" }, owner)).toEqual({ id: "merchant" });
			const [url, options] = fetch.mock.calls[0];
			expect(String(url)).toEndWith("/internal/integrations/sim-delivery_shop/merchants/company/owner");
			expect(options?.method).toBe("PUT");
			expect(options?.headers).toHaveProperty("x-internal-token");
			expect(JSON.parse(String(options?.body))).toEqual(owner);
		} finally { fetch.mockRestore(); }
	});
	it("surfaces provider rejection and non-JSON errors", async () => {
		const fetch = spyOn(globalThis, "fetch").mockResolvedValueOnce(Response.json({ message: "Email já cadastrado" }, { status: 409 })).mockResolvedValueOnce(new Response("Bad gateway", { status: 502 }));
		try {
			const client = new SimpayClient();
			const scope = { externalMerchantId: "company", integrationKey: "sim-delivery_shop" };
			await expect(client.provisionOwner(scope, { email: "owner@example.com", legalName: "Shop" })).rejects.toThrow("Email já cadastrado");
			await expect(client.provisionOwner(scope, { email: "owner@example.com", legalName: "Shop" })).rejects.toThrow("HTTP 502");
		} finally { fetch.mockRestore(); }
	});
});
