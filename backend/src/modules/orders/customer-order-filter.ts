import type { Prisma } from "sql";

/** Excludes orders cancelled before a payment was confirmed from customer-facing data. */
export const customerOrderFilter: Prisma.OrderWhereInput = {
	NOT: {
		AND: [
			{ status: "cancelado" },
			{
				OR: [{ payment: { is: null } }, { payment: { is: { status: { not: "confirmed" } } } }],
			},
		],
	},
};
