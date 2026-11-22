import { t } from "elysia";

const Param = t.Optional(t.Nullable(t.String({ maxLength: 200 })));

export const UtmLinkDestinationBody = t.Object({
	companyId: t.String({ minLength: 1 }),
	/** Unit of that company to open. Wins over `url`. */
	unitSlug: Param,
	/** Arbitrary destination: absolute http(s) URL or storefront "/path". */
	url: Param,
});
export type UtmLinkDestinationBody = typeof UtmLinkDestinationBody.static;

export const UtmLinkBody = t.Object({
	campaign: Param,
	content: Param,
	medium: Param,
	/** 1..6 segments (`instagram`, `instagram/stories`, `influencers/fulano`). Normalized to lowercase. */
	path: t.String({ maxLength: 200, minLength: 1 }),
	source: Param,
	/** Per-company destination; a company without an entry (or with neither field) lands on the home. */
	destinations: t.Optional(t.Array(UtmLinkDestinationBody)),
});
export type UtmLinkBody = typeof UtmLinkBody.static;

export const ResolveUtmLinkQuery = t.Object({ path: t.String({ maxLength: 200 }), slug: t.String({ minLength: 1 }) });
export type ResolveUtmLinkQuery = typeof ResolveUtmLinkQuery.static;
