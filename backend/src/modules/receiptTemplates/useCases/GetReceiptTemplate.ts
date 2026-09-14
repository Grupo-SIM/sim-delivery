import type { PrismaInstance } from "@/shared/infra/sql";
import { defaultReceiptTemplate } from "../defaultReceiptTemplate";
import type { ReceiptTemplate } from "../dtos";
import { isValidReceiptTemplate } from "../validateReceiptTemplate";

export class GetReceiptTemplate {
	constructor(private readonly prisma: PrismaInstance) {}

	async execute(companyId: string): Promise<ReceiptTemplate> {
		const company = await this.prisma.company.findUnique({
			select: { receiptTemplate: true },
			where: { id: companyId },
		});
		return isValidReceiptTemplate(company?.receiptTemplate) ? company.receiptTemplate : defaultReceiptTemplate;
	}
}
