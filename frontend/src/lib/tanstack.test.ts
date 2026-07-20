import { describe, expect, it } from "bun:test";
import { reactQueryClient } from "./tanstack";

describe("branding query cache", () => {
	const brandingQuery = ["/branding/", { unitId: "unit-1" }];

	it("keeps branding data fresh and cached until explicit invalidation", () => {
		expect(reactQueryClient.getQueryDefaults(brandingQuery)).toMatchObject({
			gcTime: Number.POSITIVE_INFINITY,
			staleTime: Number.POSITIVE_INFINITY,
		});
	});

	it("does not refetch branding on mount, reconnect, or window focus", () => {
		expect(reactQueryClient.getQueryDefaults(brandingQuery)).toMatchObject({
			refetchOnMount: false,
			refetchOnReconnect: false,
			refetchOnWindowFocus: false,
		});
	});
});

describe("checkout identity queries", () => {
	for (const queryKey of [["Customers", "/customers/me"], ["Cashback", "/cashback/me"], ["Loyalty", "/loyalty/me"]]) {
		it(`does not refetch ${queryKey[1]} during remounts or focus`, () => {
			expect(reactQueryClient.getQueryDefaults(queryKey)).toMatchObject({
				refetchOnMount: false,
				refetchOnReconnect: false,
				refetchOnWindowFocus: false,
				staleTime: 60_000,
			});
		});
	}
});
