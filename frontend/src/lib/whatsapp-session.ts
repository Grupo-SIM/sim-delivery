export const statusTones = {
	FAILED: "danger",
	PASSKEY_CONFIRMATION_REQUIRED: "accent",
	PASSKEY_REQUIRED: "accent",
	SCAN_QR_CODE: "accent",
	STARTING: "cyan",
	STOPPED: "neutral",
	WORKING: "success",
} as const;

export const statusLabels = {
	FAILED: "admin.units.whatsApp.status.FAILED",
	PASSKEY_CONFIRMATION_REQUIRED: "admin.units.whatsApp.status.PASSKEY_CONFIRMATION_REQUIRED",
	PASSKEY_REQUIRED: "admin.units.whatsApp.status.PASSKEY_REQUIRED",
	SCAN_QR_CODE: "admin.units.whatsApp.status.SCAN_QR_CODE",
	STARTING: "admin.units.whatsApp.status.STARTING",
	STOPPED: "admin.units.whatsApp.status.STOPPED",
	WORKING: "admin.units.whatsApp.status.WORKING",
} as const;

type WahaStatus = keyof typeof statusLabels;

export function isWahaStatus(status: string | null | undefined): status is WahaStatus {
	return Boolean(status && status in statusLabels);
}

