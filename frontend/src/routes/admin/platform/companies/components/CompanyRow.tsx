import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { LuDownload, LuLandmark, LuPencil, LuServer, LuUserPlus } from "react-icons/lu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tooltip } from "@/components/ui/Tooltip";
import { useDebouncedInput } from "@/hooks/use-debounced-input";
import { type GetCompanies200, getCompaniesQueryKey, usePatchCompaniesByCompanyId } from "@/lib/api";
import { showToast } from "@/stores";
import { downloadCompanyCompose } from "./company-compose";
import { DeploymentSettingsModal } from "./DeploymentSettingsModal";
import { ProvisionOwnerModal } from "./ProvisionOwnerModal";
import { WithdrawalSettingsModal } from "./WithdrawalSettingsModal";

interface CompanyRowProps {
	company: GetCompanies200[number];
}

export function CompanyRow({ company }: CompanyRowProps) {
	const { t } = useTranslation();
	const queryClient = useQueryClient();
	const [editing, setEditing] = useState(false);
	const [name, setName] = useState(company.name);
	const [slug, setSlug] = useState(company.slug);
	const [localName, setLocalName, flushName] = useDebouncedInput(name, setName);
	const [localSlug, setLocalSlug, flushSlug] = useDebouncedInput(slug, setSlug);
	const [error, setError] = useState<string | null>(null);
	const [financialOpen, setFinancialOpen] = useState(false);
	const [deploymentOpen, setDeploymentOpen] = useState(false);

	const update = usePatchCompaniesByCompanyId();
	const [ownerOpen, setOwnerOpen] = useState(false);

	function reset() {
		setName(company.name);
		setSlug(company.slug);
		setError(null);
		setEditing(false);
	}

	function save() {
		setError(null);
		update.mutate(
			{ companyId: company.id, data: { name, slug: slug.trim() } },
			{
				onError: caught =>
					setError(
						caught.status === 409 ? t("admin.companies.edit.slugTaken") : t("admin.companies.edit.error"),
					),
				onSuccess: async () => {
					setEditing(false);
					showToast(t("admin.companies.owner.updated"), "positive");
					await queryClient.invalidateQueries({ queryKey: getCompaniesQueryKey() });
				},
			},
		);
	}

	if (!editing) {
		return (
			<tr className="border-border/60 border-b last:border-0">
				<td className="px-4 py-3 font-medium">{company.name}</td>
				<td className="px-4 py-3 text-muted-foreground">{company.slug}</td>
				<td className="px-4 py-3 text-muted-foreground">
					{new Date(company.createdAt).toLocaleDateString()}
				</td>
				<td className="px-4 py-3 text-right">
					<div className="flex justify-end gap-2">
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
						<Tooltip content={t("admin.companies.edit.action")}>
							<Button
								aria-label={t("admin.companies.edit.action")}
								onClick={() => setEditing(true)}
								size="icon"
								type="button"
								variant="outline"
							>
								<LuPencil />
							</Button>
						</Tooltip>
						<Tooltip content={t("admin.companies.deployment.action")}>
							<Button
								aria-label={t("admin.companies.deployment.action")}
								onClick={() => setDeploymentOpen(true)}
								size="icon"
								type="button"
								variant="outline"
							>
								<LuServer />
							</Button>
						</Tooltip>
						<Tooltip content={t("admin.companies.deployment.download")}>
							<Button
								aria-label={t("admin.companies.deployment.download")}
								disabled={!company.apiUrl || !company.siteUrl}
								onClick={() => {
									try {
										downloadCompanyCompose(company);
										showToast(t("admin.companies.deployment.downloaded"), "info");
									} catch {
										showToast(t("admin.companies.deployment.downloadError"), "negative");
									}
								}}
								size="icon"
								type="button"
								variant="outline"
							>
								<LuDownload />
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
					<DeploymentSettingsModal
						company={company}
						isOpen={deploymentOpen}
						onClose={() => setDeploymentOpen(false)}
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

	return (
		<tr className="border-border/60 border-b last:border-0">
			<td className="px-4 py-3">
				<Input
					className="min-w-0"
					onBlur={() => flushName()}
					onChange={event => setLocalName(event.currentTarget.value)}
					placeholder={t("admin.companies.create.namePlaceholder")}
					value={localName}
				/>
			</td>
			<td className="px-4 py-3">
				<Input
					className="min-w-0"
					onBlur={() => flushSlug()}
					onChange={event => setLocalSlug(event.currentTarget.value)}
					placeholder={t("admin.companies.edit.slugPlaceholder")}
					value={localSlug}
				/>
				{error && <p className="mt-1 text-destructive text-xs">{error}</p>}
			</td>
			<td className="px-4 py-3 text-muted-foreground">{new Date(company.createdAt).toLocaleDateString()}</td>
			<td className="px-4 py-3">
				<div className="flex justify-end gap-2 whitespace-nowrap">
					<Button disabled={update.isPending} onClick={reset} size="sm" type="button" variant="outline">
						{t("admin.companies.edit.cancel")}
					</Button>
					<Button disabled={update.isPending || !name || !slug.trim()} onClick={save} size="sm" type="button">
						{update.isPending ? t("admin.companies.edit.saving") : t("admin.companies.edit.save")}
					</Button>
				</div>
			</td>
		</tr>
	);
}
