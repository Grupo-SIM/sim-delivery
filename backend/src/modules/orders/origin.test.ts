import { describe, expect, test } from "bun:test";
import { originColumns, readOrigin } from "./origin";

describe("order origin", () => {
	test("flattens first/last UTMs and normalizes case", () => {
		const columns = originColumns({
			fbclid: "abc",
			first: { campaign: "Branding_Instagram", content: "link_in_bio", medium: "social", source: "IG" },
			last: { source: "google" },
		});
		expect(columns).toMatchObject({ fbclid: "abc", firstUtmCampaign: "branding_instagram", firstUtmSource: "ig", lastUtmSource: "google", lastUtmContent: null });
	});

	test("last falls back to first and no origin writes nothing", () => {
		expect(originColumns({ first: { source: "ig" } })).toMatchObject({ lastUtmSource: "ig" });
		expect(originColumns(undefined)).toEqual({});
	});

	test("direct orders have no origin", () => {
		const row = Object.fromEntries(["first", "last"].flatMap(k => ["Source", "Medium", "Campaign", "Content", "Term"].map(f => [`${k}Utm${f}`, null]))) as Parameters<typeof readOrigin>[0];
		expect(readOrigin(row)).toBeNull();
		expect(readOrigin({ ...row, firstUtmSource: "ig" })?.first.source).toBe("ig");
	});
});
