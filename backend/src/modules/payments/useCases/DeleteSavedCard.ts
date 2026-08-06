import { DomainError } from "@/shared/errors";
import type { PrismaInstance } from "@/shared/infra/sql";
import type { DeleteSavedCardReturn } from "../dtos";
import { PaymentErrors } from "../errors";

export class DeleteSavedCard {
	constructor(private readonly prisma: PrismaInstance) {}

	async execute(userId: string, slug: string, cardId: string): Promise<DeleteSavedCardReturn> {
		const company = await this.prisma.company.findUnique({ where: { slug } });
		const customer = company
			? await this.prisma.customer.findFirst({ where: { companyId: company.id, userId } })
			: null;
		if (!customer) throw new DomainError(PaymentErrors.SAVED_CARD_NOT_FOUND);

		const card = await this.prisma.savedCard.findFirst({ where: { customerId: customer.id, id: cardId } });
		if (!card) throw new DomainError(PaymentErrors.SAVED_CARD_NOT_FOUND);

		await this.prisma.savedCard.delete({ where: { id: card.id } });
		if (card.isDefault) {
			const next = await this.prisma.savedCard.findFirst({
				orderBy: { createdAt: "desc" },
				where: { customerId: customer.id },
			});
			if (next) await this.prisma.savedCard.update({ data: { isDefault: true }, where: { id: next.id } });
		}

		return { id: card.id };
	}
}
