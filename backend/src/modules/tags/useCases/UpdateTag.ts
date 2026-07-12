import { DomainError } from "@/shared/errors";
import type { PrismaInstance } from "@/shared/infra/sql";
import type { TagReturn, UpdateTagBody } from "../dtos";
import { TagErrors } from "../errors";

export class UpdateTag {
	constructor(private readonly prisma: PrismaInstance) {}

	async execute(companyId: string | null, tagId: string, data: UpdateTagBody): Promise<TagReturn> {
		const tag = await this.prisma.tag.findFirst({ where: { ...(companyId ? { companyId } : {}), id: tagId } });
		if (!tag) {
			throw new DomainError(TagErrors.TAG_NOT_FOUND);
		}

		return this.prisma.tag.update({ data, where: { id: tagId } });
	}
}
