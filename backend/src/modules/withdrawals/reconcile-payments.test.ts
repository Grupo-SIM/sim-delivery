import { describe, expect, it, mock } from "bun:test";
import type { SimpayClient } from "@/shared/infra/simpay";
import type { PrismaInstance } from "@/shared/infra/sql";
import { ReconcileSimpayPayments } from "./reconcile-payments";

describe("ReconcileSimpayPayments", () => {
	it("groups confirmed provider payments by company and defaults to dry-run", async () => {
		const reconcilePayments = mock(async (merchant: { externalMerchantId: string }, paymentIds: string[], dryRun: boolean) => ({
			attributed: paymentIds.length,
			conflicts: [],
			creditedCents: merchant.externalMerchantId === "company-1" ? 3_000 : 0,
			dryRun,
			skipped: 0,
		}));
		const prisma = {
			company: {
				findUnique: mock(async ({ where }: { where: { id: string } }) => ({ cnpj: where.id === "company-1" ? "11222333000181" : null, slug: "zero-grau" })),
			},
			payment: {
				findMany: mock(async () => [
					{ order: { companyId: "company-1" }, simpayPaymentId: "payment-1" },
					{ order: { companyId: "company-1" }, simpayPaymentId: "payment-2" },
					{ order: { companyId: "company-2" }, simpayPaymentId: "payment-3" },
				]),
			},
		} as unknown as PrismaInstance;
		const simpay = { reconcilePayments } as unknown as SimpayClient;

		const result = await new ReconcileSimpayPayments(prisma, simpay).execute();

		expect(reconcilePayments).toHaveBeenCalledTimes(1);
		expect(reconcilePayments).toHaveBeenCalledWith(
			{ externalMerchantId: "company-1", integrationKey: "sim-delivery_zero-grau" },
			["payment-1", "payment-2"],
			true,
		);
		expect(result).toEqual([{
			attributed: 2,
			companyId: "company-1",
			conflicts: [],
			creditedCents: 3_000,
			dryRun: true,
			integrationKey: "sim-delivery_zero-grau",
			paymentCount: 2,
			skipped: 0,
		}]);
	});
});
