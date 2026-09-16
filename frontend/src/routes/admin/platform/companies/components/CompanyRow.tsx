import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { LuLandmark, LuPencil, LuTrash2 } from "react-icons/lu";
import { Button } from "@/components/ui/button";
import { ConfirmActionButton } from "@/components/ui/ConfirmActionButton";
import { Input } from "@/components/ui/input";
import { Tooltip } from "@/components/ui/Tooltip";
import {
	type GetCompanies200,
	getCompaniesQueryKey,
	useDeleteCompaniesByCompanyId,
	usePatchCompaniesByCompanyId,
} from "@/lib/api";
import { showAlert, showToast } from "@/stores";
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
	const [error, setError] = useState<string | null>(null);
	const [financialOpen, setFinancialOpen] = useState(false);

	const update = usePatchCompaniesByCompanyId();
	const remove = useDeleteCompaniesByCompanyId();

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
					await queryClient.invalidateQueries({ queryKey: getCompaniesQueryKey() });
				},
			},
		);
	}

	function del() {
		remove.mutate(
			{ companyId: company.id },
			{
				onError: () => void showAlert(t("admin.companies.row.deleteError")),
				onSuccess: () => {
					void queryClient.invalidateQueries({ queryKey: getCompaniesQueryKey() });
					showToast(t("admin.companies.row.deleteSuccess"), "positive");
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
							<Button aria-label="Configuração financeira" onClick={() => setFinancialOpen(true)} size="icon" type="button" variant="outline"><LuLandmark /></Button>
						</Tooltip>
						<Tooltip content={t("admin.companies.edit.action")}>
							<Button aria-label={t("admin.companies.edit.action")} onClick={() => setEditing(true)} size="icon" type="button" variant="outline"><LuPencil /></Button>
						</Tooltip>
						<ConfirmActionButton
							aria-label={t("admin.companies.row.delete")}
							confirmation={t("admin.companies.row.deleteConfirm", { name: company.name })}
							confirmLabel={t("admin.companies.row.delete")}
							disabled={remove.isPending}
							idleIcon={<LuTrash2 />}
							onConfirm={del}
							size="icon"
							tooltip={t("admin.companies.row.delete")}
							type="button"
							variant="outline"
						>
							<span className="sr-only">{t("admin.companies.row.delete")}</span>
						</ConfirmActionButton>
					</div>
					<WithdrawalSettingsModal company={company} isOpen={financialOpen} onClose={() => setFinancialOpen(false)} />
				</td>
			</tr>
		);
	}

	return (
		<tr className="border-border/60 border-b last:border-0">
			<td className="px-4 py-3">
				<Input
					className="min-w-0"
					onChange={event => setName(event.currentTarget.value)}
					placeholder={t("admin.companies.create.namePlaceholder")}
					value={name}
				/>
			</td>
			<td className="px-4 py-3">
				<Input
					className="min-w-0"
					onChange={event => setSlug(event.currentTarget.value)}
					placeholder={t("admin.companies.edit.slugPlaceholder")}
					value={slug}
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
