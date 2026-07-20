import { t } from "elysia";

/**
 * Safe public shape of a staff member (owner, manager, attendant, kitchen, or courier). Never exposes credentials.
 * `role` is a plain string on the wire (the frontend translates it via t());
 * this also avoids a Kubb quirk that collapses enum-in-array-item response types.
 */
export const StaffReturn = t.Object({
	createdAt: t.Date(),
	email: t.String(),
	id: t.String(),
	name: t.String(),
	role: t.String(),
	unitIds: t.Array(t.String()),
});
export type StaffReturn = typeof StaffReturn.static;

export const StaffListReturn = t.Array(StaffReturn);
export type StaffListReturn = typeof StaffListReturn.static;
