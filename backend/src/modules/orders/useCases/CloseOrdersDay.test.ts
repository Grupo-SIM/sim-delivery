import { describe, expect, it, mock } from "bun:test";
import type { PrismaInstance } from "@/shared/infra/sql";
import { CloseOrdersDay } from "./CloseOrdersDay";

describe("CloseOrdersDay", () => {
	it("updates the board boundary without changing pending orders or reservations", async () => {
		const startedAt = new Date("2026-10-09T21:00:00Z");
		const update = mock(async () => ({ orderBoardStartedAt: startedAt }));
		const findMany = mock(async () => [{ id: "ord_pending" }]);
		const transaction = mock(async () => {});
		const prisma = {
			company: { update },
			order: { findMany },
			$transaction: transaction,
		} as unknown as PrismaInstance;

		expect(await new CloseOrdersDay(prisma).execute("cmp_1")).toEqual({
			orderBoardStartedAt: startedAt.toISOString(),
		});
		expect(update).toHaveBeenCalledWith({
			data: { orderBoardStartedAt: expect.any(Date) },
			select: { orderBoardStartedAt: true },
			where: { id: "cmp_1" },
		});
		expect(findMany).not.toHaveBeenCalled();
		expect(transaction).not.toHaveBeenCalled();
	});

	it("rejects closing without a company scope", async () => {
		const update = mock(async () => {});
		const prisma = { company: { update } } as unknown as PrismaInstance;
		await expect(new CloseOrdersDay(prisma).execute(null)).rejects.toThrow();
		expect(update).not.toHaveBeenCalled();
	});
});
