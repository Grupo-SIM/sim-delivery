import { describe, expect, it } from "bun:test";
import type { SimpayCompanyFees } from "@/shared/infra/simpay";
import type { PrismaInstance } from "@/shared/infra/sql";
import { CompanyFees } from "./CompanyFees";

const lane = (ratePpm: number) => ({ channel: "ONLINE" as const, fixedCents: 0, installments: 1, method: "PIX" as const, ratePpm });

function setup(mode: string) {
	const state = { mode, saved: undefined as unknown };
	let provider: SimpayCompanyFees = { costs: [lane(9_800)], lanes: [lane(10_000)], version: "1" };
	const prisma = {
		company: {
			findUnique: async () => ({ platformFeeMode: state.mode }),
			update: async ({ data }: { data: { platformFeeMode: string } }) => void (state.mode = data.platformFeeMode),
		},
		platformFee: { findMany: async () => [] },
	} as unknown as PrismaInstance;
	const client = {
		companyFees: async () => provider,
		saveCompanyFees: async (_: string, input: { lanes: SimpayCompanyFees["lanes"]; version: string }) => {
			state.saved = input;
			provider = { ...provider, lanes: input.lanes, version: "2" };
			return provider;
		},
	};
	return { fees: new CompanyFees(prisma, client), state };
}

describe("company fees", () => {
	it("rejects SimIntPay fees below the acquirer cost and does not save them", async () => {
		const { fees, state } = setup("both");
		await expect(fees.update("c", { simintpay: { lanes: [lane(1_000)], version: "1" } })).rejects.toThrow();
		expect(state.saved).toBeUndefined();
	});

	it("saves covered SimIntPay fees", async () => {
		const { fees, state } = setup("both");
		const result = await fees.update("c", { simintpay: { lanes: [lane(12_000)], version: "1" } });
		expect(result.underCovered).toBe(false);
		expect(result.simintpay.version).toBe("2");
		expect(state.saved).toBeDefined();
	});

	it("rejects switching to extras mode when no surcharge covers the cost", async () => {
		const { fees, state } = setup("both");
		await expect(fees.update("c", { mode: "extras" })).rejects.toThrow();
		expect(state.mode).toBe("both");
	});
});
