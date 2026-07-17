import { t } from "elysia";
import { TagPlain } from "sql/typebox";

/** Public shape of a tag, reused across tag endpoints. */
const AssociatedProductReturn = t.Object({ id: t.String(), title: t.String() });
export const TagReturn = t.Object({ ...TagPlain.properties, products: t.Array(AssociatedProductReturn) });
export type TagReturn = typeof TagReturn.static;

export const TagListReturn = t.Array(TagReturn);
export type TagListReturn = typeof TagListReturn.static;
