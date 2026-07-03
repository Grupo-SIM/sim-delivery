import { t } from "elysia";
import { UnitHoursPlain } from "sql/typebox";

/** Public shape of a weekly-hours row, reused across the hours endpoints. */
export const UnitHoursReturn = UnitHoursPlain;
export type UnitHoursReturn = typeof UnitHoursReturn.static;

export const UnitHoursListReturn = t.Array(UnitHoursReturn);
export type UnitHoursListReturn = typeof UnitHoursListReturn.static;
