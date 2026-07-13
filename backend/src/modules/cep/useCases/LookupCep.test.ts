import { afterEach, describe, expect, it, mock } from "bun:test";
import { DomainError } from "@/shared/errors";
import { LookupCep } from "./LookupCep";

const originalFetch = globalThis.fetch;

function mockFetch(payload: unknown, ok = true) {
	globalThis.fetch = mock(async () => ({ json: async () => payload, ok })) as unknown as typeof fetch;
}

afterEach(() => {
	globalThis.fetch = originalFetch;
});

describe("LookupCep", () => {
	it("normalizes a Brasil API response with coordinates into address fields", async () => {
		mockFetch({
			cep: "04038001",
			city: "São Paulo",
			location: { coordinates: { latitude: "-23.5970665", longitude: "-46.6432640" } },
			neighborhood: "Vila Clementino",
			state: "SP",
			street: "Rua Borges Lagoa",
		});

		const result = await new LookupCep().execute("04038-001");

		expect(result).toEqual({
			addressLine: "Rua Borges Lagoa",
			city: "São Paulo",
			complement: "",
			latitude: -23.5970665,
			longitude: -46.643264,
			neighborhood: "Vila Clementino",
			state: "SP",
			zipCode: "04038001",
		});
	});

	it("returns null coordinates when Brasil API has no geolocation for the CEP", async () => {
		mockFetch({
			cep: "01001000",
			city: "São Paulo",
			location: { coordinates: {} },
			neighborhood: "Sé",
			state: "SP",
			street: "Praça da Sé",
		});

		const result = await new LookupCep().execute("01001000");

		expect(result.latitude).toBeNull();
		expect(result.longitude).toBeNull();
	});

	it("defaults missing optional fields to empty strings", async () => {
		mockFetch({ cep: "12345678", city: "Testville", state: "TS" });

		const result = await new LookupCep().execute("12345678");

		expect(result.addressLine).toBe("");
		expect(result.complement).toBe("");
		expect(result.neighborhood).toBe("");
	});

	it("rejects a CEP without 8 digits", async () => {
		await expect(new LookupCep().execute("123")).rejects.toThrow(DomainError);
	});

	it("rejects an unknown CEP (Brasil API 404)", async () => {
		mockFetch({ message: "not found" }, false);

		await expect(new LookupCep().execute("00000000")).rejects.toThrow("CEP_NOT_FOUND");
	});

	it("rejects when the request fails", async () => {
		globalThis.fetch = mock(async () => {
			throw new Error("network down");
		}) as unknown as typeof fetch;

		await expect(new LookupCep().execute("01001000")).rejects.toThrow("CEP_NOT_FOUND");
	});
});
