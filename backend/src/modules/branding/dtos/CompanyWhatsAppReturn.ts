import { t } from "elysia";
import { __nullable__ } from "sql/typebox";

export const CompanyWhatsAppReturn = t.Object({
	configured: t.Boolean(),
	connectedPhone: __nullable__(t.String()),
	lastError: __nullable__(t.String()),
	lastSyncedAt: __nullable__(t.String()),
	sessionName: __nullable__(t.String()),
	status: __nullable__(t.String()),
});
export type CompanyWhatsAppReturn = typeof CompanyWhatsAppReturn.static;

export const CompanyWhatsAppQrReturn = t.Object({ dataUrl: t.String() });
export type CompanyWhatsAppQrReturn = typeof CompanyWhatsAppQrReturn.static;
