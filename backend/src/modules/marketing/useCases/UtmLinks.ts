import { Prisma } from "sql";
import { DomainError } from "@/shared/errors";
import type { PrismaInstance } from "@/shared/infra/sql";
import type { ResolvedUtmLinkReturn, UtmLinkBody } from "../dtos";
import { MarketingErrors } from "../errors";
import { normalizeUtmPath, utmDestinationRows, utmLinkColumns } from "../utm-link";

const DESTINATION_SELECT = { select: { companyId: true, unitSlug: true, url: true } } as const;

export class UtmLinks {
	constructor(private readonly prisma: PrismaInstance) {}

	list() {
		return this.prisma.utmLink.findMany({ include: { destinations: DESTINATION_SELECT }, orderBy: { path: "asc" } });
	}

	async create(body: UtmLinkBody) {
		const columns = utmLinkColumns(body);
		const destinations = await this.destinations(body);
		return this.guardUnique(() =>
			this.prisma.utmLink.create({ data: { ...columns, destinations: { create: destinations } }, include: { destinations: DESTINATION_SELECT } }),
		);
	}

	async update(id: string, body: UtmLinkBody) {
		await this.get(id);
		const columns = utmLinkColumns(body);
		const destinations = await this.destinations(body);
		return this.guardUnique(() =>
			this.prisma.utmLink.update({
				data: { ...columns, destinations: { create: destinations, deleteMany: {} } },
				include: { destinations: DESTINATION_SELECT },
				where: { id },
			}),
		);
	}

	async delete(id: string) {
		await this.get(id);
		await this.prisma.utmLink.delete({ where: { id } });
	}

	/** Public: null when the path is unknown (the storefront then just goes home). */
	async resolve(slug: string, path: string): Promise<ResolvedUtmLinkReturn> {
		const normalized = normalizeUtmPath(path);
		if (!normalized) return null;
		const link = await this.prisma.utmLink.findFirst({
			select: {
				campaign: true,
				content: true,
				destinations: { select: { unitSlug: true, url: true }, take: 1, where: { company: { slug } } },
				medium: true,
				source: true,
			},
			where: { path: normalized },
		});
		if (!link) return null;
		const { destinations, ...utms } = link;
		return { ...utms, unitSlug: destinations[0]?.unitSlug ?? null, url: destinations[0]?.url ?? null };
	}

	/** Normalized destination rows; a unit slug must exist in its company. */
	private async destinations(body: UtmLinkBody) {
		const rows = utmDestinationRows(body.destinations);
		for (const row of rows) {
			if (!row.unitSlug) continue;
			const unit = await this.prisma.unit.findFirst({ select: { id: true }, where: { companyId: row.companyId, slug: row.unitSlug } });
			if (!unit) throw new DomainError(MarketingErrors.UTM_LINK_INVALID_URL);
		}
		return rows;
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
