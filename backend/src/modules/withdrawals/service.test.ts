import { describe, expect, it, mock } from "bun:test";
import type { SimpayClient } from "@/shared/infra/simpay";
import type { PrismaInstance } from "@/shared/infra/sql";
import { WithdrawalService } from "./service";

function setup(minimum: number | null = null) {
	const company = {
		cnpj: "11222333000181",
		id: "company-1",
		withdrawalMinimumCents: minimum,
		withdrawalPixKey: null as string | null,
	};
	const withdrawals: Array<Record<string, unknown>> = [];
	const statusEvents: Array<Record<string, unknown>> = [];
	const prismaData = {
		company: {
			findUnique: mock(async () => company),
			update: mock(async ({ data }: { data: { withdrawalPixKey?: string } }) => {
				company.withdrawalPixKey = data.withdrawalPixKey ?? company.withdrawalPixKey;
				return company;
			}),
		},
		withdrawal: {
			create: mock(async ({ data }: { data: Record<string, unknown> }) => {
				const item = {
					...data,
					createdAt: new Date("2026-09-16T12:00:00Z"),
					externalWithdrawalId: null,
					feeCents: 0,
					id: "withdrawal-1",
					netAmountCents: 0,
					providerUpdatedAt: null,
					rejectionReason: null,
					status: "submitting",
					updatedAt: new Date("2026-09-16T12:00:00Z"),
				};
				withdrawals.push(item);
				return item;
			}),
			findFirst: mock(async ({ where }: { where: { companyId: string; externalWithdrawalId?: string; id?: string } }) =>
				withdrawals.find(item => item.companyId === where.companyId && (where.id ? item.id === where.id : item.externalWithdrawalId === where.externalWithdrawalId)) ?? null),
			update: mock(async ({ data, where }: { data: Record<string, unknown>; where: { id: string } }) => {
				const item = withdrawals.find(candidate => candidate.id === where.id)!;
				Object.assign(item, data, { updatedAt: new Date("2026-09-16T12:01:00Z") });
				return item;
			}),
		},
		withdrawalStatusEvent: {
			upsert: mock(async ({ create }: { create: Record<string, unknown> }) => {
				const existing = statusEvents.find(event => event.providerEventId === create.providerEventId);
				if (existing) return existing;
				statusEvents.push(create);
				return create;
			}),
		},
	} as Record<string, unknown>;
	prismaData.$transaction = async (callback: (tx: unknown) => unknown) => callback(prismaData);
	const prisma = prismaData as unknown as PrismaInstance;
	const simpay = {
		quoteWithdrawal: mock(async (_companyId: string, grossAmountCents: number) => ({
			feeCents: 100,
			grossAmountCents,
			netAmountCents: grossAmountCents - 100,
		})),
		requestWithdrawal: mock(async (_companyId: string, input: { grossAmountCents: number; pixKey: string; requestId: string }) => ({
			createdAt: "2026-09-16T12:00:00Z",
			feeCents: 100,
			grossAmountCents: input.grossAmountCents,
			id: "provider-1",
			netAmountCents: input.grossAmountCents - 100,
			pixKey: input.pixKey,
			rejectionReason: null,
			requestId: input.requestId,
			status: "PENDING",
			updatedAt: "2026-09-16T12:00:00Z",
		})),
	} as unknown as SimpayClient;
	return { company, service: new WithdrawalService(prisma, simpay), simpay, statusEvents, withdrawals };
}

describe("WithdrawalService", () => {
	it("allows any positive gross amount when company minimum is unset", async () => {
		const { service, simpay } = setup(null);

		await expect(service.quote("company-1", 1_000)).resolves.toEqual({
			feeCents: 100,
			grossAmountCents: 1_000,
			netAmountCents: 900,
		});
		expect(simpay.quoteWithdrawal).toHaveBeenCalledWith("company-1", 1_000);
	});

	it("enforces configured company minimum before calling SIM INT PAY", async () => {
		const { service, simpay } = setup(5_000);

		await expect(service.quote("company-1", 4_999)).rejects.toThrow("WITHDRAWAL_AMOUNT_BELOW_MINIMUM");
		expect(simpay.quoteWithdrawal).not.toHaveBeenCalled();
	});

	it("uses local idempotency id and saves the requested Pix key", async () => {
		const { company, service, simpay } = setup();

		const result = await service.request("company-1", "user-1", 10_000, "financeiro@empresa.com.br");

		expect(simpay.requestWithdrawal).toHaveBeenCalledWith("company-1", {
			grossAmountCents: 10_000,
			pixKey: "financeiro@empresa.com.br",
			requestId: "withdrawal-1",
		});
		expect(company.withdrawalPixKey).toBe("financeiro@empresa.com.br");
		expect(result).toMatchObject({ externalWithdrawalId: "provider-1", status: "PENDING" });
	});

	it("accepts a repeated provider event without duplicating audit events", async () => {
		const { service, statusEvents, withdrawals } = setup();
		await service.request("company-1", "user-1", 10_000, "financeiro@empresa.com.br");
		const event = {
			eventId: "provider-1:COMPLETED",
			externalMerchantId: "company-1",
			rejectionReason: null,
			requestId: "withdrawal-1",
			status: "COMPLETED",
			updatedAt: "2026-09-16T12:02:00Z",
			withdrawalId: "provider-1",
		};

		await service.webhook(event);
		await service.webhook(event);

		expect(statusEvents).toHaveLength(1);
		expect(withdrawals[0]?.status).toBe("COMPLETED");
	});
});
