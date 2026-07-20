import { DomainError } from "@/shared/errors";
import type { PrismaInstance } from "@/shared/infra/sql";
import type { LoyaltyBalanceReturn } from "../dtos";
import { LoyaltyErrors } from "../errors";

export class GetLoyaltyBalance {
	constructor(private readonly prisma: PrismaInstance) {}

	async execute(userId: string, slug: string): Promise<LoyaltyBalanceReturn> {
		const company = await this.prisma.company.findUnique({ where: { slug } });
		if (!company) throw new DomainError(LoyaltyErrors.COMPANY_NOT_FOUND);

		const customer = await this.prisma.customer.findFirst({
			where: { companyId: company.id, userId },
		});
		if (!customer) return { balancePoints: 0 };

		const ledger = await this.prisma.loyaltyLedger.findMany({
			select: { amount: true },
			where: { customerId: customer.id },
		});

		const balancePoints = ledger.reduce((sum, entry) => sum + entry.amount, 0);
		return { balancePoints: Math.max(0, balancePoints) };
	}
}
