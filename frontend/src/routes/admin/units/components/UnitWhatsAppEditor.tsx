import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { LuMessageCircle, LuRefreshCw, LuUnplug } from "react-icons/lu";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/Modal";
import { Skeleton } from "@/components/ui/Skeleton";
import {
	getUnitsByUnitIdWhatsappQueryKey,
	getUnitsByUnitIdWhatsappQrQueryKey,
	useGetUnitsByUnitIdWhatsapp,
	useGetUnitsByUnitIdWhatsappQr,
	usePostUnitsByUnitIdWhatsappDisconnect,
	usePostUnitsByUnitIdWhatsappSession,
} from "@/lib/api";
import { showAlert, showToast } from "@/stores";
import { isWahaStatus, statusLabels, statusTones } from "@/lib/whatsapp-session";

interface WhatsAppUnit {
	id: string;
	name: string;
}

interface UnitWhatsAppEditorProps {
	onClose: () => void;
	unit: WhatsAppUnit | null;
}

export function UnitWhatsAppEditor({ onClose, unit }: UnitWhatsAppEditorProps) {
	const { t } = useTranslation();
	const queryClient = useQueryClient();
	const unitId = unit?.id;
	const statusQuery = useGetUnitsByUnitIdWhatsapp(unitId, {
		query: {
			refetchInterval: query => {
				const status = query.state.data?.status;
				return unitId && status !== "WORKING" && status !== "STOPPED" ? 2_500 : false;
			},
		},
	});
	const rawStatus = statusQuery.data?.status;
	const status = isWahaStatus(rawStatus) ? rawStatus : null;
	const qrQuery = useGetUnitsByUnitIdWhatsappQr(unitId, {
		query: { enabled: Boolean(unitId) && status === "SCAN_QR_CODE", refetchInterval: 2_500 },
	});
	const connect = usePostUnitsByUnitIdWhatsappSession();
	const disconnect = usePostUnitsByUnitIdWhatsappDisconnect();

	async function refresh() {
		if (!unitId) return;
		await Promise.all([
			queryClient.invalidateQueries({ queryKey: getUnitsByUnitIdWhatsappQueryKey(unitId) }),
			queryClient.invalidateQueries({ queryKey: getUnitsByUnitIdWhatsappQrQueryKey(unitId) }),
		]);
	}

	function connectSession() {
		if (!unitId) return;
		connect.mutate(
			{ unitId },
			{
				onError: () => void showAlert(t("admin.units.whatsApp.connectError")),
				onSettled: refresh,
				onSuccess: async data => {
					await queryClient.resetQueries({ queryKey: getUnitsByUnitIdWhatsappQrQueryKey(unitId) });
					showToast(t("admin.units.whatsApp.connectSuccess"), "positive");
					queryClient.setQueryData(getUnitsByUnitIdWhatsappQueryKey(unitId), data);
				},
			},
		);
	}

	function disconnectSession() {
		if (!unitId) return;
		disconnect.mutate(
			{ unitId },
			{
				onError: () => void showAlert(t("admin.units.whatsApp.disconnectError")),
				onSettled: refresh,
				onSuccess: async data => {
					await queryClient.resetQueries({ queryKey: getUnitsByUnitIdWhatsappQrQueryKey(unitId) });
					showToast(t("admin.units.whatsApp.disconnectSuccess"), "positive");
					queryClient.setQueryData(getUnitsByUnitIdWhatsappQueryKey(unitId), data);
				},
			},
		);
	}

	const busy = connect.isPending || disconnect.isPending;
	const statusLabel = status ? t(statusLabels[status]) : t("admin.units.whatsApp.status.UNCONFIGURED");

	return (
		<Modal
			isOpen={unit !== null}
			maxWidth="560px"
			onClose={onClose}
			title={t("admin.units.whatsApp.title", { name: unit?.name })}
			urlKey="unit-whatsapp"
			urlState={unitId}
		>
			{statusQuery.isPending ? (
				<div className="space-y-4">
					<Skeleton className="h-20 w-full" />
					<Skeleton className="mx-auto size-64" />
				</div>
			) : statusQuery.isError ? (
				<div className="space-y-3">
					<p className="text-destructive text-sm">{t("admin.units.whatsApp.connectError")}</p>
					<Button onClick={() => void refresh()} type="button" variant="outline">
						<LuRefreshCw className="size-4" />
						{t("admin.units.whatsApp.refresh")}
					</Button>
				</div>
			) : (
				<div className="space-y-5">
					<div className="rounded-xl border border-border bg-muted/30 p-4">
						<div className="flex flex-wrap items-center justify-between gap-3">
							<div className="flex items-center gap-3">
								<div className="grid size-10 place-items-center rounded-full bg-success/15 text-success">
									<LuMessageCircle className="size-5" />
								</div>
								<div>
									<p className="font-semibold">{t("admin.units.whatsApp.connection")}</p>
									<p className="text-muted-foreground text-sm">
										{statusQuery.data?.connectedPhone ?? t("admin.units.whatsApp.noPhone")}
									</p>
								</div>
							</div>
							<Badge tone={status ? statusTones[status] : "neutral"}>{statusLabel}</Badge>
						</div>
					</div>

					{status === "SCAN_QR_CODE" && (
						<div className="space-y-3 text-center">
							<p className="text-muted-foreground text-sm">{t("admin.units.whatsApp.scanHint")}</p>
							{qrQuery.isPending ? (
								<Skeleton className="mx-auto size-64" />
							) : qrQuery.data?.dataUrl ? (
								<img
									alt={t("admin.units.whatsApp.qrAlt")}
									className="mx-auto size-64 rounded-xl border border-border bg-white p-3"
									src={qrQuery.data.dataUrl}
								/>
							) : (
								<p className="text-destructive text-sm">{t("admin.units.whatsApp.qrError")}</p>
							)}
						</div>
					)}

					<p className="text-muted-foreground text-sm">{t("admin.units.whatsApp.fallbackHint")}</p>

					<div className="flex flex-wrap justify-end gap-2">
						<Button disabled={busy} onClick={() => void refresh().then(() => showToast(t("admin.units.whatsApp.refresh"), "info"))} type="button" variant="outline">
							<LuRefreshCw className="size-4" />
							{t("admin.units.whatsApp.refresh")}
						</Button>
						{status === "WORKING" && (
							<Button disabled={busy} onClick={disconnectSession} type="button" variant="outline">
								<LuUnplug className="size-4" />
								{t("admin.units.whatsApp.disconnect")}
							</Button>
						)}
						{(!statusQuery.data?.configured || status === "STOPPED" || status === "FAILED") && (
							<Button disabled={busy} onClick={connectSession} type="button">
								<LuMessageCircle className="size-4" />
								{connect.isPending ? t("admin.units.whatsApp.connecting") : t("admin.units.whatsApp.connect")}
							</Button>
						)}
					</div>
				</div>
			)}
		</Modal>
	);
}
