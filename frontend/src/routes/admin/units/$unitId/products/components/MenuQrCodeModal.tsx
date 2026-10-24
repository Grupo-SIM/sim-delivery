import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { LuDownload } from "react-icons/lu";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/Modal";
import { Skeleton } from "@/components/ui/Skeleton";
import { branding } from "@/lib/branding";
import { showToast } from "@/stores";
import { downloadMenuImage, menuExportFilename, unitMenuUrl } from "./menu-export";
import { MenuTaxesField } from "./MenuTaxesField";

interface MenuQrCodeModalProps {
	unitSlug: string;
	unitName: string;
	onClose: () => void;
}

export function MenuQrCodeModal({ unitSlug, unitName, onClose }: MenuQrCodeModalProps) {
	const { t } = useTranslation();
	const [taxes, setTaxes] = useState(false);
	const url = unitMenuUrl(branding.siteUrl || window.location.origin, unitSlug, taxes);
	const qr = useQuery({
		queryKey: ["unit-menu-qr", url],
		queryFn: async () => {
			const { default: QRCode } = await import("qrcode");
			return QRCode.toDataURL(url, { errorCorrectionLevel: "M", margin: 4, width: 1024 });
		},
		staleTime: Number.POSITIVE_INFINITY,
		retry: false,
	});

	function download() {
		if (!qr.data) return;
		try {
			downloadMenuImage(qr.data, menuExportFilename(unitSlug, taxes, "png"));
			showToast(t("admin.unitProducts.export.qrSuccess"), "positive");
		} catch {
			showToast(t("admin.unitProducts.export.qrError"), "negative");
		}
	}

	return (
		<Modal isOpen onClose={onClose} title={t("admin.unitProducts.export.qrTitle")} urlKey="unit-menu-qr" urlState={`${unitSlug}:${taxes}`} maxWidth="480px">
			<div className="space-y-5">
				<p className="text-muted-foreground text-sm">{t("admin.unitProducts.export.qrDescription", { name: unitName })}</p>
				<MenuTaxesField checked={taxes} onChange={setTaxes} />
				{qr.isPending ? (
					<Skeleton className="mx-auto aspect-square w-64 max-w-full" />
				) : qr.isError ? (
					<p className="text-destructive text-sm" role="alert">{t("admin.unitProducts.export.qrError")}</p>
				) : (
					<img alt={t("admin.unitProducts.export.qrAlt", { name: unitName })} className="mx-auto aspect-square w-64 max-w-full rounded border border-border bg-white" src={qr.data} />
				)}
				<a className="block break-all text-primary text-sm underline" href={url} rel="noreferrer" target="_blank">{url}</a>
				<div className="flex justify-end">
					<Button disabled={!qr.data || qr.isPending || qr.isError} onClick={download} type="button">
						<LuDownload aria-hidden className="size-4" />
						{t("admin.unitProducts.export.qrDownload")}
					</Button>
				</div>
			</div>
		</Modal>
	);
}
