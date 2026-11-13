import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useGetBrandingWhatsapp } from "@/lib/api";
import { showToast } from "@/stores";

const REAUTH_STATUSES = new Set(["SCAN_QR_CODE", "PASSKEY_REQUIRED", "PASSKEY_CONFIRMATION_REQUIRED"]);
const POLL_MS = 60_000;

/** Keeps warning managers while the company WhatsApp session needs a new QR Code scan. */
export function WhatsAppReauthToasts() {
	const { t } = useTranslation();
	const { data } = useGetBrandingWhatsapp({
		query: { refetchInterval: POLL_MS, retry: false },
	});
	const needsReauth = Boolean(data?.status && REAUTH_STATUSES.has(data.status));

	useEffect(() => {
		if (!needsReauth) return;
		const warn = () => showToast(t("admin.units.whatsApp.reauthToast"), "warning");
		warn();
		const timer = setInterval(warn, POLL_MS);
		return () => clearInterval(timer);
	}, [needsReauth, t]);

	return null;
}
