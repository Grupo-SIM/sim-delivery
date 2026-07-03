import { t } from "elysia";

/** A single weekday entry of a unit's weekly hours (docs/04). `weekday`: 0 = Sunday .. 6. */
export const UnitHoursDay = t.Object({
	closed: t.Boolean(),
	closesAt: t.Nullable(t.String()),
	opensAt: t.Nullable(t.String()),
	weekday: t.Integer({ maximum: 6, minimum: 0 }),
});
export type UnitHoursDay = typeof UnitHoursDay.static;

/** Body for replacing a unit's whole weekly schedule in one request. */
export const SetUnitHoursBody = t.Object({ hours: t.Array(UnitHoursDay) });
export type SetUnitHoursBody = typeof SetUnitHoursBody.static;
