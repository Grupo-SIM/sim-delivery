import { t } from "elysia";
import { __nullable__ } from "sql/typebox";

export const UtmLinkReturn = t.Object({
	campaign: __nullable__(t.String()),
	content: __nullable__(t.String()),
	createdAt: t.Date(),
	id: t.String(),
	medium: __nullable__(t.String()),
	path: t.String(),
	source: __nullable__(t.String()),
	updatedAt: t.Date(),
	url: __nullable__(t.String()),
});
export type UtmLinkReturn = typeof UtmLinkReturn.static;
export const UtmLinkListReturn = t.Array(UtmLinkReturn);

/** What the storefront needs to redirect: only the UTMs and the optional unit. */
export const ResolvedUtmLinkReturn = __nullable__(
	t.Object({
		campaign: __nullable__(t.String()),
		content: __nullable__(t.String()),
		medium: __nullable__(t.String()),
		source: __nullable__(t.String()),
		url: __nullable__(t.String()),
	}),
);
export type ResolvedUtmLinkReturn = typeof ResolvedUtmLinkReturn.static;
