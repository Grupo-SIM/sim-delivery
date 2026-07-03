import { DomainError } from "@/shared/errors";
import type { PrismaInstance } from "@/shared/infra/sql";
import type { CreateTagBody, TagReturn } from "../dtos";
import { TagErrors } from "../errors";

export class CreateTag {
	constructor(private readonly prisma: PrismaInstance) {}

	async execute(companyId: string | null, data: CreateTagBody): Promise<TagReturn> {
		if (!companyId) {
			throw new DomainError(TagErrors.NO_COMPANY);
		}

		return this.prisma.tag.create({ data: { ...data, companyId } });
	}
}
