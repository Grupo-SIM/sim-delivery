import type { PrismaInstance } from "@/shared/infra/sql";
import type { CompanyListReturn } from "../dtos";

export class ListCompanies {
	constructor(private readonly prisma: PrismaInstance) {}

	async execute(): Promise<CompanyListReturn> {
		return this.prisma.company.findMany({ orderBy: { createdAt: "desc" } });
	}
}
