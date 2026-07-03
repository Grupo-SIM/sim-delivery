import { t } from "elysia";
import { UnitPlain } from "sql/typebox";

/** Public shape of a unit, reused across unit endpoints. */
export const UnitReturn = UnitPlain;
export type UnitReturn = typeof UnitReturn.static;

export const UnitListReturn = t.Array(UnitReturn);
export type UnitListReturn = typeof UnitListReturn.static;

/** A unit plus its computed open/closed status (docs/04), used by the list endpoint. */
export const UnitWithStatusReturn = t.Object({ ...UnitPlain.properties, isOpenNow: t.Boolean() });
export type UnitWithStatusReturn = typeof UnitWithStatusReturn.static;

export const UnitWithStatusListReturn = t.Array(UnitWithStatusReturn);
export type UnitWithStatusListReturn = typeof UnitWithStatusListReturn.static;
