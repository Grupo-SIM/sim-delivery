import type { PrismaInstance } from "@/shared/infra/sql";
import type { SavedCardsReturn } from "../dtos";

export class ListSavedCards {
	constructor(private readonly prisma: PrismaInstance) {}

	async execute(userId: string, slug: string): Promise<SavedCardsReturn> {
		const company = await this.prisma.company.findUnique({ where: { slug } });
		if (!company) return [];

		const customer = await this.prisma.customer.findFirst({
			where: { companyId: company.id, userId },
		});
		if (!customer) return [];

		const cards = await this.prisma.savedCard.findMany({
			orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
			where: { customerId: customer.id },
		});

		return cards.map(card => ({
			brand: card.brand,
			expiryMonth: card.expiryMonth,
			expiryYear: card.expiryYear,
			holderName: card.holderName,
			id: card.id,
			isDefault: card.isDefault,
			last4: card.last4,
		}));
	}
}
