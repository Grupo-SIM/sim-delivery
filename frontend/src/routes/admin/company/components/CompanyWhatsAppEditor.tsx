import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { LuMessageCircle, LuRefreshCw, LuUnplug } from "react-icons/lu";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/Modal";
import { Skeleton } from "@/components/ui/Skeleton";
import {
	getBrandingWhatsappQueryKey,
	useGetBrandingWhatsapp,
	useGetBrandingWhatsappQr,
	usePostBrandingWhatsappDisconnect,
	usePostBrandingWhatsappSession,
} from "@/lib/api";
import { showAlert, showToast } from "@/stores";

const statusTones = { FAILED: "danger", SCAN_QR_CODE: "accent", STARTING: "cyan", STOPPED: "neutral", WORKING: "success" } as const;

export function CompanyWhatsAppEditor({ onClose, open }: { onClose: () => void; open: boolean }) {
	const { t } = useTranslation();
	const queryClient = useQueryClient();
	const statusQuery = useGetBrandingWhatsapp({ query: { enabled: open, refetchInterval: query => query.state.data?.status === "WORKING" || query.state.data?.status === "STOPPED" ? false : 2_500 } });
	const status = statusQuery.data?.status;
	const qrQuery = useGetBrandingWhatsappQr({ query: { enabled: open && status === "SCAN_QR_CODE", refetchInterval: 10_000 } });
	const connect = usePostBrandingWhatsappSession();
	const disconnect = usePostBrandingWhatsappDisconnect();
	const refresh = () => queryClient.invalidateQueries({ queryKey: getBrandingWhatsappQueryKey() });
	const busy = connect.isPending || disconnect.isPending;
	return <Modal isOpen={open} maxWidth="560px" onClose={onClose} title="WhatsApp global" urlKey="company-whatsapp" urlState="global">
		{statusQuery.isPending ? <div className="space-y-4"><Skeleton className="h-20 w-full" /><Skeleton className="mx-auto size-64" /></div> : <div className="space-y-5">
			<div className="rounded-xl border border-border bg-muted/30 p-4">
				<div className="flex items-center justify-between gap-3"><span className="text-muted-foreground text-sm">Status</span><Badge tone={status && status in statusTones ? statusTones[status as keyof typeof statusTones] : "neutral"}>{status ?? "Não configurado"}</Badge></div>
				{statusQuery.data?.connectedPhone && <p className="mt-2 text-sm">{statusQuery.data.connectedPhone}</p>}
				{statusQuery.data?.lastError && <p className="mt-2 text-destructive text-sm">{statusQuery.data.lastError}</p>}
			</div>
			{status === "SCAN_QR_CODE" && <div className="space-y-3 text-center"><p className="text-muted-foreground text-sm">{t("admin.units.whatsApp.scanHint")}</p>{qrQuery.isPending ? <Skeleton className="mx-auto size-64" /> : qrQuery.data?.dataUrl ? <img alt={t("admin.units.whatsApp.qrAlt")} className="mx-auto size-64 rounded-xl border border-border bg-white p-3" src={qrQuery.data.dataUrl} /> : <p className="text-destructive text-sm">{t("admin.units.whatsApp.qrError")}</p>}</div>}
			<p className="text-muted-foreground text-sm">Usado para OTP de login e como fallback nas atualizações de pedidos de unidades sem WhatsApp próprio.</p>
			<div className="flex flex-wrap justify-end gap-2"><Button disabled={busy} onClick={() => void refresh()} type="button" variant="outline"><LuRefreshCw className="size-4" />{t("admin.units.whatsApp.refresh")}</Button>{statusQuery.data?.configured && status !== "STOPPED" && <Button disabled={busy} onClick={() => disconnect.mutate(undefined, { onError: () => void showAlert(t("admin.units.whatsApp.disconnectError")), onSuccess: () => { showToast(t("admin.units.whatsApp.disconnectSuccess"), "positive"); void refresh(); } })} type="button" variant="outline"><LuUnplug className="size-4" />{t("admin.units.whatsApp.disconnect")}</Button>}{(!statusQuery.data?.configured || status === "STOPPED" || status === "FAILED") && <Button disabled={busy} onClick={() => connect.mutate(undefined, { onError: () => void showAlert(t("admin.units.whatsApp.connectError")), onSuccess: () => { showToast(t("admin.units.whatsApp.connectSuccess"), "positive"); void refresh(); } })} type="button"><LuMessageCircle className="size-4" />{connect.isPending ? t("admin.units.whatsApp.connecting") : t("admin.units.whatsApp.connect")}</Button>}</div>
		</div>}
	</Modal>;
}
