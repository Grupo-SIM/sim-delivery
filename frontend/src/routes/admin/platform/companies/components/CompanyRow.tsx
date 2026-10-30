import { useState } from "react";
import { useTranslation } from "react-i18next";
import { LuLandmark, LuPencil, LuPercent, LuUserPlus } from "react-icons/lu";
import { Button } from "@/components/ui/button";
import { Tooltip } from "@/components/ui/Tooltip";
import type { GetCompanies200 } from "@/lib/api";
import { CompanyFeesModal } from "./CompanyFeesModal";
import { DownloadVisualIdentityButton } from "./DownloadVisualIdentityButton";
import { EditCompanyModal } from "./EditCompanyModal";
import { ProvisionOwnerModal } from "./ProvisionOwnerModal";
import { WithdrawalSettingsModal } from "./WithdrawalSettingsModal";

interface CompanyRowProps {
	company: GetCompanies200[number];
}

export function CompanyRow({ company }: CompanyRowProps) {
	const { t } = useTranslation();
	const [financialOpen, setFinancialOpen] = useState(false);
	const [editOpen, setEditOpen] = useState(false);
	const [ownerOpen, setOwnerOpen] = useState(false);
	const [feesOpen, setFeesOpen] = useState(false);

	return (
		<tr className="border-border/60 border-b last:border-0">
			<td className="px-4 py-3 font-medium">{company.name}</td>
			<td className="px-4 py-3 text-muted-foreground">{company.slug}</td>
			<td className="px-4 py-3 text-muted-foreground">
				{new Date(company.createdAt).toLocaleDateString()}
			</td>
			<td className="px-4 py-3 text-right">
				<div className="flex justify-end gap-2">
					<DownloadVisualIdentityButton company={company} />
					<Tooltip content="Configuração financeira">
						<Button
							aria-label="Configuração financeira"
							onClick={() => setFinancialOpen(true)}
							size="icon"
							type="button"
							variant="outline"
						>
							<LuLandmark />
						</Button>
					</Tooltip>
					<Tooltip content={t("admin.companies.fees.action")}>
						<Button
							aria-label={t("admin.companies.fees.action")}
							onClick={() => setFeesOpen(true)}
							size="icon"
							type="button"
							variant="outline"
						>
							<LuPercent />
						</Button>
					</Tooltip>
					<Tooltip content={t("admin.companies.edit.action")}>
						<Button
							aria-label={t("admin.companies.edit.action")}
							onClick={() => setEditOpen(true)}
							size="icon"
							type="button"
							variant="outline"
						>
							<LuPencil />
						</Button>
					</Tooltip>
					<Tooltip content={t("admin.companies.owner.action")}>
						<Button
							aria-label={t("admin.companies.owner.action")}
							onClick={() => setOwnerOpen(true)}
							size="icon"
							type="button"
							variant="outline"
						>
							<LuUserPlus />
						</Button>
					</Tooltip>
				</div>
				<EditCompanyModal
					company={company}
					isOpen={editOpen}
					onClose={() => setEditOpen(false)}
				/>
				<CompanyFeesModal
					companyId={company.id}
					companyName={company.name}
					isOpen={feesOpen}
					onClose={() => setFeesOpen(false)}
				/>
				<ProvisionOwnerModal company={company} isOpen={ownerOpen} onClose={() => setOwnerOpen(false)} />
				<WithdrawalSettingsModal
					company={company}
					isOpen={financialOpen}
					onClose={() => setFinancialOpen(false)}
				/>
			</td>
		</tr>
	);
}
