import { useState } from "react";
import { useTranslation } from "react-i18next";
import { LuDownload, LuQrCode } from "react-icons/lu";
import { Button } from "@/components/ui/button";
import { MenuPdfModal } from "./MenuPdfModal";
import { MenuQrCodeModal } from "./MenuQrCodeModal";

interface UnitMenuActionsProps {
	unitSlug: string;
	unitName: string;
}

export function UnitMenuActions({ unitSlug, unitName }: UnitMenuActionsProps) {
	const { t } = useTranslation();
	const [pdfOpen, setPdfOpen] = useState(false);
	const [qrOpen, setQrOpen] = useState(false);
	return (
		<div className="flex flex-wrap items-center gap-2">
			<Button onClick={() => setPdfOpen(true)} type="button" variant="outline">
				<LuDownload aria-hidden className="size-4" />
				{t("admin.unitProducts.export.pdfAction")}
			</Button>
			<Button onClick={() => setQrOpen(true)} type="button" variant="outline">
				<LuQrCode aria-hidden className="size-4" />
				{t("admin.unitProducts.export.qrAction")}
			</Button>
			{pdfOpen && <MenuPdfModal onClose={() => setPdfOpen(false)} unitName={unitName} unitSlug={unitSlug} />}
			{qrOpen && <MenuQrCodeModal onClose={() => setQrOpen(false)} unitName={unitName} unitSlug={unitSlug} />}
		</div>
	);
}
