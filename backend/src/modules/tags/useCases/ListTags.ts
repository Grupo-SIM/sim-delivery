import type { PrismaInstance } from "@/shared/infra/sql";
import type { TagListReturn } from "../dtos";

export class ListTags {
	constructor(private readonly prisma: PrismaInstance) {}

	async execute(companyId: string | null): Promise<TagListReturn> {
		return this.prisma.tag.findMany({
			orderBy: [{ name: "asc" }],
			where: { ...(companyId ? { companyId } : {}) },
		});
	}
}
