import { afterEach, describe, expect, it, mock } from "bun:test";
import { DomainError } from "@/shared/errors";
import { LookupCep } from "./LookupCep";

const originalFetch = globalThis.fetch;

function mockFetch(...responses: Array<{ ok?: boolean; payload: unknown }>) {
	globalThis.fetch = mock(async () => {
		const response = responses.shift();
		if (!response) throw new Error("unexpected request");
		return { json: async () => response.payload, ok: response.ok ?? true };
	}) as unknown as typeof fetch;
}

afterEach(() => {
	globalThis.fetch = originalFetch;
});

describe("LookupCep", () => {
	it("normalizes a ViaCEP response into address fields", async () => {
		mockFetch(
			{
				payload: {
					bairro: "Vila Clementino",
					cep: "04038001",
					localidade: "São Paulo",
					logradouro: "Rua Borges Lagoa",
					uf: "SP",
				},
			},
			{ payload: { location: { coordinates: { latitude: "-23.5970665", longitude: "-46.6432640" } } } },
		);

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
		mockFetch(
			{
				payload: {
					bairro: "Sé",
					cep: "01001000",
					localidade: "São Paulo",
					logradouro: "Praça da Sé",
					uf: "SP",
				},
			},
			{ payload: { location: { coordinates: {} } } },
		);

		const result = await new LookupCep().execute("01001000");

		expect(result.latitude).toBeNull();
		expect(result.longitude).toBeNull();
	});

	it("returns ViaCEP address when Brasil API coordinate lookup fails", async () => {
		mockFetch({
			payload: {
				bairro: "Sé",
				cep: "01001000",
				localidade: "São Paulo",
				logradouro: "Praça da Sé",
				uf: "SP",
			},
		});

		const result = await new LookupCep().execute("01001000");

		expect(result.addressLine).toBe("Praça da Sé");
		expect(result.latitude).toBeNull();
		expect(result.longitude).toBeNull();
	});

	it("defaults missing optional fields to empty strings", async () => {
		mockFetch({ payload: { cep: "12345678", localidade: "Testville", uf: "TS" } }, { payload: {} });

		const result = await new LookupCep().execute("12345678");

		expect(result.addressLine).toBe("");
		expect(result.complement).toBe("");
		expect(result.neighborhood).toBe("");
	});

	it("rejects a CEP without 8 digits", async () => {
		await expect(new LookupCep().execute("123")).rejects.toThrow(DomainError);
	});

	it("rejects an unknown CEP reported by ViaCEP", async () => {
		mockFetch({ payload: { erro: true } });

		await expect(new LookupCep().execute("00000000")).rejects.toThrow("CEP_NOT_FOUND");
	});

	it("rejects when the request fails", async () => {
		globalThis.fetch = mock(async () => {
			throw new Error("network down");
		}) as unknown as typeof fetch;

		await expect(new LookupCep().execute("01001000")).rejects.toThrow("CEP_NOT_FOUND");
	});
});
