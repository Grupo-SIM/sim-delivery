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
	it("normalizes a ViaCEP response into address fields", async () => {
		mockFetch({
			bairro: "Sé",
			cep: "01001-000",
			complemento: "lado ímpar",
			localidade: "São Paulo",
			logradouro: "Praça da Sé",
			uf: "SP",
		});

		const result = await new LookupCep().execute("01001-000");

		expect(result).toEqual({
			addressLine: "Praça da Sé",
			city: "São Paulo",
			complement: "lado ímpar",
			neighborhood: "Sé",
			state: "SP",
			zipCode: "01001000",
		});
	});

	it("defaults missing optional fields to empty strings", async () => {
		mockFetch({ cep: "12345-678", localidade: "Testville", uf: "TS" });

		const result = await new LookupCep().execute("12345678");

		expect(result.addressLine).toBe("");
		expect(result.complement).toBe("");
		expect(result.neighborhood).toBe("");
	});

	it("rejects a CEP without 8 digits", async () => {
		await expect(new LookupCep().execute("123")).rejects.toThrow(DomainError);
	});

	it("rejects an unknown CEP (ViaCEP `erro`)", async () => {
		mockFetch({ erro: true });

		await expect(new LookupCep().execute("00000000")).rejects.toThrow("CEP_NOT_FOUND");
	});

	it("rejects when the request fails", async () => {
		globalThis.fetch = mock(async () => {
			throw new Error("network down");
		}) as unknown as typeof fetch;

		await expect(new LookupCep().execute("01001000")).rejects.toThrow("CEP_NOT_FOUND");
	});
});
