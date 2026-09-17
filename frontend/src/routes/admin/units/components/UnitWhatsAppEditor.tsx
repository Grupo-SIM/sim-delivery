import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { LuMessageCircle, LuRefreshCw, LuUnplug } from "react-icons/lu";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/Modal";
import { Skeleton } from "@/components/ui/Skeleton";
import {
	getUnitsByUnitIdWhatsappQueryKey,
	useGetUnitsByUnitIdWhatsapp,
	useGetUnitsByUnitIdWhatsappQr,
	usePostUnitsByUnitIdWhatsappDisconnect,
	usePostUnitsByUnitIdWhatsappSession,
} from "@/lib/api";
import { showAlert, showToast } from "@/stores";

interface WhatsAppUnit {
	id: string;
	name: string;
}

interface UnitWhatsAppEditorProps {
	onClose: () => void;
	unit: WhatsAppUnit | null;
}

const statusTones = {
	FAILED: "danger",
	PASSKEY_CONFIRMATION_REQUIRED: "accent",
	PASSKEY_REQUIRED: "accent",
	SCAN_QR_CODE: "accent",
	STARTING: "cyan",
	STOPPED: "neutral",
	WORKING: "success",
} as const;

const statusLabels = {
	FAILED: "admin.units.whatsApp.status.FAILED",
	PASSKEY_CONFIRMATION_REQUIRED: "admin.units.whatsApp.status.PASSKEY_CONFIRMATION_REQUIRED",
	PASSKEY_REQUIRED: "admin.units.whatsApp.status.PASSKEY_REQUIRED",
	SCAN_QR_CODE: "admin.units.whatsApp.status.SCAN_QR_CODE",
	STARTING: "admin.units.whatsApp.status.STARTING",
	STOPPED: "admin.units.whatsApp.status.STOPPED",
	WORKING: "admin.units.whatsApp.status.WORKING",
} as const;

type WahaStatus = keyof typeof statusLabels;

function isWahaStatus(status: string | null | undefined): status is WahaStatus {
	return Boolean(status && status in statusLabels);
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
	const qrQuery = useGetUnitsByUnitIdWhatsappQr(status === "SCAN_QR_CODE" ? unitId : undefined, {
		query: { refetchInterval: 10_000 },
	});
	const connect = usePostUnitsByUnitIdWhatsappSession();
	const disconnect = usePostUnitsByUnitIdWhatsappDisconnect();

	async function refresh() {
		if (!unitId) return;
		await queryClient.invalidateQueries({ queryKey: getUnitsByUnitIdWhatsappQueryKey(unitId) });
	}

	function connectSession() {
		if (!unitId) return;
		connect.mutate(
			{ unitId },
			{
				onError: () => void showAlert(t("admin.units.whatsApp.connectError")),
				onSuccess: async () => {
					showToast(t("admin.units.whatsApp.connectSuccess"), "positive");
					await refresh();
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
				onSuccess: async () => {
					showToast(t("admin.units.whatsApp.disconnectSuccess"), "positive");
					await refresh();
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
						<Button disabled={busy} onClick={() => void refresh()} type="button" variant="outline">
							<LuRefreshCw className="size-4" />
							{t("admin.units.whatsApp.refresh")}
						</Button>
						{statusQuery.data?.configured && status !== "STOPPED" && (
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
