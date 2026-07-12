import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { type GetCompanies200, getCompaniesQueryKey, usePatchCompaniesByCompanyId } from "@/lib/api";

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

	const { isPending, mutate } = usePatchCompaniesByCompanyId();

	function reset() {
		setName(company.name);
		setSlug(company.slug);
		setError(null);
		setEditing(false);
	}

	function save() {
		setError(null);
		mutate(
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

	if (!editing) {
		return (
			<tr className="border-border/60 border-b last:border-0">
				<td className="px-4 py-3 font-medium">{company.name}</td>
				<td className="px-4 py-3 text-muted-foreground">{company.slug}</td>
				<td className="px-4 py-3 text-muted-foreground">
					{new Date(company.createdAt).toLocaleDateString()}
				</td>
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
					<Button disabled={isPending} onClick={reset} size="sm" type="button" variant="outline">
						{t("admin.companies.edit.cancel")}
					</Button>
					<Button disabled={isPending || !name || !slug.trim()} onClick={save} size="sm" type="button">
						{isPending ? t("admin.companies.edit.saving") : t("admin.companies.edit.save")}
					</Button>
				</div>
			</td>
		</tr>
	);
}
