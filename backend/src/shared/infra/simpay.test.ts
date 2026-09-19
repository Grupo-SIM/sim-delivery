import { describe, expect, it } from "bun:test";
import { isApprovedSimpayStatus, isFailedSimpayStatus, simpayIntegrationKey } from "./simpay";

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
