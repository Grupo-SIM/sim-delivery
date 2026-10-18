import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { RequiredMark } from "@/components/ui/label";
import { Modal } from "@/components/ui/Modal";
import { TextField } from "@/components/ui/TextField";
import { closeActiveModalHistory } from "@/hooks/use-modal-history";
import { type GetCompanies200, getCompaniesQueryKey, usePatchCompaniesByCompanyId } from "@/lib/api";
import { showToast } from "@/stores";

interface DeploymentSettingsModalProps {
	company: GetCompanies200[number];
	isOpen: boolean;
	onClose: () => void;
}

export function DeploymentSettingsModal({ company, isOpen, onClose }: DeploymentSettingsModalProps) {
	const { t } = useTranslation();
	const queryClient = useQueryClient();
	const [apiUrl, setApiUrl] = useState(company.apiUrl ?? "");
	const [siteUrl, setSiteUrl] = useState(company.siteUrl ?? "");
	const [ownerEmail, setOwnerEmail] = useState(company.ownerEmail ?? "");
	const update = usePatchCompaniesByCompanyId();
	useEffect(() => {
		if (!isOpen) return;
		setApiUrl(company.apiUrl ?? "");
		setSiteUrl(company.siteUrl ?? "");
		setOwnerEmail(company.ownerEmail ?? "");
	}, [company, isOpen]);
	return (
		<Modal
			isOpen={isOpen}
			onClose={onClose}
			title={t("admin.companies.deployment.title", { name: company.name })}
			urlKey="company-deployment"
			urlState={company.id}
		>
			<form
				className="space-y-5"
				onSubmit={event => {
					event.preventDefault();
					if (update.isPending) return;
					update.mutate(
						{
							companyId: company.id,
							data: {
								apiUrl: apiUrl.trim(),
								ownerEmail: ownerEmail.trim().toLowerCase() || null,
								siteUrl: siteUrl.trim(),
							},
						},
						{
							onError: () => showToast(t("admin.companies.deployment.error"), "negative"),
							onSuccess: async () => {
								await queryClient.invalidateQueries({ queryKey: getCompaniesQueryKey() });
								showToast(t("admin.companies.deployment.saved"), "positive");
								closeActiveModalHistory();
							},
						},
					);
				}}
			>
				<p className="text-muted-foreground text-sm">
					{t("admin.companies.deployment.identity", { name: company.name, slug: company.slug })}
				</p>
				<TextField
					autoComplete="url"
					label={
						<span>
							{t("admin.companies.deployment.siteUrl")} <RequiredMark />
						</span>
					}
					name="company-site-url"
					onValueChange={setSiteUrl}
					pattern={"https?://[^\\/?#@]+/?"}
					placeholder="https://delivery.empresa.com.br"
					required
					type="url"
					value={siteUrl}
				/>
				<TextField
					autoComplete="url"
					label={
						<span>
							{t("admin.companies.deployment.apiUrl")} <RequiredMark />
						</span>
					}
					name="company-api-url"
					onValueChange={setApiUrl}
					pattern={"https?://[^\\/?#@]+/?"}
					placeholder="https://api.delivery.empresa.com.br"
					required
					type="url"
					value={apiUrl}
				/>
				<TextField
					autoComplete="email"
					label={t("admin.companies.deployment.ownerEmail")}
					name="company-owner-email"
					onValueChange={setOwnerEmail}
					placeholder="dono@empresa.com.br"
					type="email"
					value={ownerEmail}
				/>
				<p className="text-muted-foreground text-sm">{t("admin.companies.deployment.hint")}</p>
				<div className="flex justify-end gap-2">
					<Button onClick={() => closeActiveModalHistory()} type="button" variant="outline">
						{t("actions.discard")}
					</Button>
					<Button disabled={update.isPending || !apiUrl.trim() || !siteUrl.trim()} type="submit">
						{t(update.isPending ? "admin.companies.edit.saving" : "actions.save")}
					</Button>
				</div>
			</form>
		</Modal>
	);
}
