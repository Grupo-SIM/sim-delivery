import { UserErrors } from "@/modules/users/errors";
import { DomainError } from "@/shared/errors";
import type { PrismaInstance } from "@/shared/infra/sql";
import type { ReceiptTemplate, UpdateReceiptTemplateDTO } from "../dtos";
import { isValidReceiptTemplate } from "../validateReceiptTemplate";

export class UpdateReceiptTemplate {
	constructor(private readonly prisma: PrismaInstance) {}

	async execute({ blocks, companyId }: UpdateReceiptTemplateDTO): Promise<ReceiptTemplate> {
		if (!companyId || !isValidReceiptTemplate({ blocks })) throw new DomainError(UserErrors.FORBIDDEN);
		const company = await this.prisma.company.update({
			data: { receiptTemplate: { blocks } },
			select: { receiptTemplate: true },
			where: { id: companyId },
		});
		return company.receiptTemplate as ReceiptTemplate;
	}
}
