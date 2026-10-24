import { useState } from "react";
import { useTranslation } from "react-i18next";
import { LuDownload } from "react-icons/lu";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/Modal";
import { useLiveBranding } from "@/hooks/use-live-branding";
import { getPublicUnitsByUnitSlugMenu } from "@/lib/api";
import { slug } from "@/lib/variant";
import { showToast } from "@/stores";
import { loadMenuImages, menuExportFilename } from "./menu-export";
import { MenuTaxesField } from "./MenuTaxesField";

interface MenuPdfModalProps {
	unitSlug: string;
	unitName: string;
	onClose: () => void;
}

export function MenuPdfModal({ unitSlug, unitName, onClose }: MenuPdfModalProps) {
	const { t } = useTranslation();
	const branding = useLiveBranding();
	const [taxes, setTaxes] = useState(false);
	const [busy, setBusy] = useState(false);

	async function download() {
		setBusy(true);
		try {
			const [sections, { createMenuPdf }] = await Promise.all([
				getPublicUnitsByUnitSlugMenu(unitSlug, { slug }),
				import("./menu-pdf"),
			]);
			if (!sections.some(section => section.items.length > 0)) {
				showToast(t("admin.unitProducts.export.empty"), "negative");
				return;
			}
			const images = await loadMenuImages(sections);
			const pdf = createMenuPdf({
				companyName: branding.companyName,
				unitName,
				sections,
				taxes,
				images,
				labels: {
					from: t("store.product.from"),
					loose: t("store.menu.loose"),
					taxes: t(taxes ? "admin.unitProducts.export.withTaxes" : "admin.unitProducts.export.withoutTaxes"),
					title: t("admin.unitProducts.export.menuTitle"),
				},
			});
			await pdf.save(menuExportFilename(unitSlug, taxes, "pdf"), { returnPromise: true });
			showToast(t("admin.unitProducts.export.pdfSuccess"), "positive");
		} catch {
			showToast(t("admin.unitProducts.export.pdfError"), "negative");
		} finally {
			setBusy(false);
		}
	}

	return (
		<Modal isOpen onClose={onClose} title={t("admin.unitProducts.export.pdfTitle")} urlKey="unit-menu-pdf" urlState={unitSlug} maxWidth="480px">
			<div className="space-y-5">
				<p className="text-muted-foreground text-sm">{t("admin.unitProducts.export.pdfDescription", { name: unitName })}</p>
				<MenuTaxesField checked={taxes} disabled={busy} onChange={setTaxes} />
				<div className="flex justify-end">
					<Button disabled={busy} onClick={() => void download()} type="button">
						<LuDownload aria-hidden className="size-4" />
						{t(busy ? "admin.unitProducts.export.preparing" : "admin.unitProducts.export.pdfAction")}
					</Button>
				</div>
			</div>
		</Modal>
	);
}
