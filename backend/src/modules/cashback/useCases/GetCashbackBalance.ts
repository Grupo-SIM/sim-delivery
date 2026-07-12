import { DomainError } from "@/shared/errors";
import type { PrismaInstance } from "@/shared/infra/sql";
import type { CashbackBalanceReturn } from "../dtos";
import { CashbackErrors } from "../errors";

export class GetCashbackBalance {
	constructor(private readonly prisma: PrismaInstance) {}

	async execute(userId: string, slug: string): Promise<CashbackBalanceReturn> {
		const company = await this.prisma.company.findUnique({ where: { slug } });
		if (!company) throw new DomainError(CashbackErrors.COMPANY_NOT_FOUND);

		const customer = await this.prisma.customer.findFirst({
			where: { companyId: company.id, userId },
		});
		if (!customer) throw new DomainError(CashbackErrors.CUSTOMER_NOT_FOUND);

		const ledger = await this.prisma.cashbackLedger.findMany({
			select: { amount: true },
			where: { customerId: customer.id },
		});

		const balanceCents = ledger.reduce((sum, entry) => sum + entry.amount, 0);
		return { balanceCents: Math.max(0, balanceCents) };
	}
}
