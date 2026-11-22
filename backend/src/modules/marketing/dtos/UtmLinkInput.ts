import { t } from "elysia";

const Param = t.Optional(t.Nullable(t.String({ maxLength: 200 })));

export const UtmLinkBody = t.Object({
	campaign: Param,
	content: Param,
	medium: Param,
	/** 1..6 segments (`instagram`, `instagram/stories`, `influencers/fulano`). Normalized to lowercase. */
	path: t.String({ maxLength: 200, minLength: 1 }),
	source: Param,
	/** Redirect destination: absolute http(s) URL or storefront "/path". Empty = home. */
	url: Param,
});
export type UtmLinkBody = typeof UtmLinkBody.static;

export const ResolveUtmLinkQuery = t.Object({ path: t.String({ maxLength: 200 }) });
export type ResolveUtmLinkQuery = typeof ResolveUtmLinkQuery.static;
