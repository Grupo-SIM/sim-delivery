import { describe, expect, it } from "bun:test";
import { isApprovedSimpayStatus, isFailedSimpayStatus } from "./simpay";

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
