import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { getCompaniesQueryKey, type GetCompanies200, usePatchCompaniesByCompanyId } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface CompanyRowProps {
	company: GetCompanies200[number];
}

export function CompanyRow({ company }: CompanyRowProps) {
	const { t } = useTranslation();
	const queryClient = useQueryClient();
	const [editing, setEditing] = useState(false);
	const [name, setName] = useState(company.name);
	const [variantKey, setVariantKey] = useState(company.variantKey ?? "");
	const [error, setError] = useState<string | null>(null);

	const { isPending, mutate } = usePatchCompaniesByCompanyId();

	function reset() {
		setName(company.name);
		setVariantKey(company.variantKey ?? "");
		setError(null);
		setEditing(false);
	}

	function save() {
		setError(null);
		mutate(
			{ companyId: company.id, data: { name, variantKey: variantKey.trim() || null } },
			{
				onError: caught =>
					setError(caught.status === 409 ? t("admin.companies.edit.variantTaken") : t("admin.companies.edit.error")),
				onSuccess: async () => {
					setEditing(false);
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
					{company.variantKey ?? t("admin.companies.variantUnset")}
				</td>
				<td className="px-4 py-3 text-muted-foreground">{new Date(company.createdAt).toLocaleDateString()}</td>
				<td className="px-4 py-3 text-right">
					<Button onClick={() => setEditing(true)} size="sm" type="button" variant="outline">
						{t("admin.companies.edit.action")}
					</Button>
				</td>
			</tr>
		);
	}

	return (
		<tr className="border-border/60 border-b last:border-0">
			<td className="px-4 py-3">
				<Input onChange={event => setName(event.currentTarget.value)} value={name} />
			</td>
			<td className="px-4 py-3 text-muted-foreground">{company.slug}</td>
			<td className="px-4 py-3" colSpan={2}>
				<Input
					onChange={event => setVariantKey(event.currentTarget.value)}
					placeholder={t("admin.companies.edit.variantPlaceholder")}
					value={variantKey}
				/>
				{error && <p className="mt-1 text-destructive text-xs">{error}</p>}
			</td>
			<td className="px-4 py-3">
				<div className="flex justify-end gap-2">
					<Button disabled={isPending} onClick={reset} size="sm" type="button" variant="outline">
						{t("admin.companies.edit.cancel")}
					</Button>
					<Button disabled={isPending || !name} onClick={save} size="sm" type="button">
						{isPending ? t("admin.companies.edit.saving") : t("admin.companies.edit.save")}
					</Button>
				</div>
			</td>
		</tr>
	);
}
