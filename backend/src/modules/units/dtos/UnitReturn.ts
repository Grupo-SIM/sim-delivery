import { t } from "elysia";
import { UnitPlain } from "sql/typebox";

/** Public shape of a unit, reused across unit endpoints. */
export const UnitReturn = UnitPlain;
export type UnitReturn = typeof UnitReturn.static;

export const UnitListReturn = t.Array(UnitReturn);
export type UnitListReturn = typeof UnitListReturn.static;
