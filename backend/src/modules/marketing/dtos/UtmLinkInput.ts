import { t } from "elysia";

const Param = t.Optional(t.Nullable(t.String({ maxLength: 200 })));

export const UtmLinkBody = t.Object({
	campaign: Param,
	content: Param,
	medium: Param,
	/** 1..6 segments (`instagram`, `instagram/stories`, `influencers/fulano`). Normalized to lowercase. */
	path: t.String({ maxLength: 200, minLength: 1 }),
	source: Param,
	unitSlug: Param,
});
export type UtmLinkBody = typeof UtmLinkBody.static;

export const ListUtmLinksQuery = t.Object({ companyId: t.String({ minLength: 1 }) });
export const CreateUtmLinkBody = t.Object({ ...UtmLinkBody.properties, companyId: t.String({ minLength: 1 }) });
export type CreateUtmLinkBody = typeof CreateUtmLinkBody.static;

export const ResolveUtmLinkQuery = t.Object({ path: t.String({ maxLength: 200 }), slug: t.String({ minLength: 1 }) });
export type ResolveUtmLinkQuery = typeof ResolveUtmLinkQuery.static;
