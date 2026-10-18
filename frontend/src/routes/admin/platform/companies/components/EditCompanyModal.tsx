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

interface EditCompanyModalProps {
	company: GetCompanies200[number];
	isOpen: boolean;
	onClose: () => void;
}

export function EditCompanyModal({ company, isOpen, onClose }: EditCompanyModalProps) {
	const { t } = useTranslation();
	const queryClient = useQueryClient();
	const [apiUrl, setApiUrl] = useState(company.apiUrl ?? "");
	const [siteUrl, setSiteUrl] = useState(company.siteUrl ?? "");
	const [name, setName] = useState(company.name);
	const [slug, setSlug] = useState(company.slug);
	const update = usePatchCompaniesByCompanyId();
	useEffect(() => {
		if (!isOpen) return;
		setApiUrl(company.apiUrl ?? "");
		setSiteUrl(company.siteUrl ?? "");
		setName(company.name);
		setSlug(company.slug);
	}, [company, isOpen]);
	return (
		<Modal
			isOpen={isOpen}
			onClose={onClose}
			title={t("admin.companies.edit.title", { name: company.name })}
			urlKey="company-edit"
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
								name: name.trim(),
								slug: slug.trim(),
								siteUrl: siteUrl.trim(),
							},
						},
						{
							onError: caught =>
								showToast(
									t(caught.status === 409 ? "admin.companies.edit.slugTaken" : "admin.companies.edit.error"),
									"negative",
								),
							onSuccess: async () => {
								await queryClient.invalidateQueries({ queryKey: getCompaniesQueryKey() });
								showToast(t("admin.companies.edit.saved"), "positive");
								closeActiveModalHistory();
							},
						},
					);
				}}
			>
				<TextField
					autoComplete="organization"
					label={
						<span>
							{t("admin.companies.create.name")} <RequiredMark />
						</span>
					}
					name="company-name"
					onValueChange={setName}
					placeholder={t("admin.companies.create.namePlaceholder")}
					required
					value={name}
				/>
				<TextField
					label={
						<span>
							{t("admin.companies.create.slug")} <RequiredMark />
						</span>
					}
					name="company-slug"
					onValueChange={setSlug}
					placeholder={t("admin.companies.edit.slugPlaceholder")}
					required
					value={slug}
				/>
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
				<div className="flex justify-end gap-2">
					<Button onClick={() => closeActiveModalHistory()} type="button" variant="outline">
						{t("actions.discard")}
					</Button>
					<Button
						disabled={update.isPending || !name.trim() || !slug.trim() || !apiUrl.trim() || !siteUrl.trim()}
						type="submit"
					>
						{t(update.isPending ? "admin.companies.edit.saving" : "actions.save")}
					</Button>
				</div>
			</form>
		</Modal>
	);
}
