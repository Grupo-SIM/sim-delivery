import { t } from "elysia";

const WahaStatus = t.Union([
	t.Literal("STOPPED"),
	t.Literal("STARTING"),
	t.Literal("SCAN_QR_CODE"),
	t.Literal("PASSKEY_REQUIRED"),
	t.Literal("PASSKEY_CONFIRMATION_REQUIRED"),
	t.Literal("WORKING"),
	t.Literal("FAILED"),
]);

export const UnitWhatsAppReturn = t.Object({
	configured: t.Boolean(),
	connectedPhone: t.Nullable(t.String()),
	lastError: t.Nullable(t.String()),
	lastSyncedAt: t.Nullable(t.String({ format: "date-time" })),
	sessionName: t.Nullable(t.String()),
	status: t.Nullable(WahaStatus),
});
export type UnitWhatsAppReturn = typeof UnitWhatsAppReturn.static;

export const UnitWhatsAppQrReturn = t.Object({ dataUrl: t.String() });
export type UnitWhatsAppQrReturn = typeof UnitWhatsAppQrReturn.static;
