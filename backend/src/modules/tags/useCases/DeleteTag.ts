import { DomainError } from "@/shared/errors";
import type { PrismaInstance } from "@/shared/infra/sql";
import { TagErrors } from "../errors";

export class DeleteTag {
	constructor(private readonly prisma: PrismaInstance) {}

	async execute(companyId: string | null, tagId: string): Promise<void> {
		const tag = await this.prisma.tag.findFirst({ where: { ...(companyId ? { companyId } : {}), id: tagId } });
		if (!tag) {
			throw new DomainError(TagErrors.TAG_NOT_FOUND);
		}

		await this.prisma.tag.delete({ where: { id: tagId } });
	}
}
