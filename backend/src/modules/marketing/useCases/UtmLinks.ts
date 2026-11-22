import { Prisma } from "sql";
import { DomainError } from "@/shared/errors";
import type { PrismaInstance } from "@/shared/infra/sql";
import type { ResolvedUtmLinkReturn, UtmLinkBody } from "../dtos";
import { MarketingErrors } from "../errors";
import { normalizeUtmPath, utmLinkColumns } from "../utm-link";

export class UtmLinks {
	constructor(private readonly prisma: PrismaInstance) {}

	list() {
		return this.prisma.utmLink.findMany({ orderBy: { path: "asc" } });
	}

	async create(body: UtmLinkBody) {
		return this.guardUnique(() => this.prisma.utmLink.create({ data: utmLinkColumns(body) }));
	}

	async update(id: string, body: UtmLinkBody) {
		await this.get(id);
		return this.guardUnique(() => this.prisma.utmLink.update({ data: utmLinkColumns(body), where: { id } }));
	}

	async delete(id: string) {
		await this.get(id);
		await this.prisma.utmLink.delete({ where: { id } });
	}

	/** Public: null when the path is unknown (the storefront then just goes home). */
	async resolve(path: string): Promise<ResolvedUtmLinkReturn> {
		const normalized = normalizeUtmPath(path);
		if (!normalized) return null;
		const link = await this.prisma.utmLink.findFirst({
			select: { campaign: true, content: true, medium: true, source: true, url: true },
			where: { path: normalized },
		});
		return link;
	}

	private async get(id: string) {
		const link = await this.prisma.utmLink.findUnique({ where: { id } });
		if (!link) throw new DomainError(MarketingErrors.UTM_LINK_NOT_FOUND);
		return link;
	}

	private async guardUnique<T>(run: () => Promise<T>) {
		try {
			return await run();
		} catch (error) {
			if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
				throw new DomainError(MarketingErrors.UTM_LINK_PATH_TAKEN);
			}
			throw error;
		}
	}
}
