import { useTranslation } from "react-i18next";
import { LuDownload } from "react-icons/lu";
import { Button } from "@/components/ui/button";
import { Tooltip } from "@/components/ui/Tooltip";
import { downloadVisualIdentityTemplate, type VisualIdentityCompany } from "@/lib/visual-identity/template";
import { showToast } from "@/stores";

interface DownloadVisualIdentityButtonProps {
	company?: VisualIdentityCompany;
	showLabel?: boolean;
}

export function DownloadVisualIdentityButton({ company, showLabel = !company }: DownloadVisualIdentityButtonProps) {
	const { t } = useTranslation();
	const label = company
		? t("admin.companies.visualIdentity.downloadCompany", { name: company.name })
		: t("admin.companies.visualIdentity.download");
	return (
		<Tooltip content={label}>
			<Button
				aria-label={label}
				onClick={() => {
					try {
						downloadVisualIdentityTemplate(company);
						showToast(t("admin.companies.visualIdentity.success"), "info");
					} catch {
						showToast(t("admin.companies.visualIdentity.error"), "negative");
					}
				}}
				size={showLabel ? "md" : "icon"}
				type="button"
				variant="outline"
			>
				<LuDownload />
				{showLabel && label}
			</Button>
		</Tooltip>
	);
}
