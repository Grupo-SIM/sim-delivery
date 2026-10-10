import { UserErrors } from "@/modules/users/errors";
import { DomainError } from "@/shared/errors";
import type { PrismaInstance } from "@/shared/infra/sql";
import type { CloseOrdersDayReturn } from "../dtos";

export class CloseOrdersDay {
	constructor(private readonly prisma: PrismaInstance) {}

	async execute(companyId: string | null): Promise<CloseOrdersDayReturn> {
		if (!companyId) throw new DomainError(UserErrors.FORBIDDEN);
		const company = await this.prisma.company.update({
			data: { orderBoardStartedAt: new Date() },
			select: { orderBoardStartedAt: true },
			where: { id: companyId },
		});
		return { orderBoardStartedAt: company.orderBoardStartedAt!.toISOString() };
	}
}
