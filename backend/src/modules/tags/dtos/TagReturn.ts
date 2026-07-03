import { t } from "elysia";
import { TagPlain } from "sql/typebox";

/** Public shape of a tag, reused across tag endpoints. */
export const TagReturn = TagPlain;
export type TagReturn = typeof TagReturn.static;

export const TagListReturn = t.Array(TagReturn);
export type TagListReturn = typeof TagListReturn.static;
