import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getCompaniesQueryKey, usePostCompanies } from "@/lib/api";

function slugify(value: string): string {
	return value
		.toLowerCase()
		.normalize("NFD")
		.replace(/[\u0300-\u036f]/g, "")
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "");
}

export function CreateCompanyForm() {
	const { t } = useTranslation();
	const queryClient = useQueryClient();
	const [name, setName] = useState("");
	const [slug, setSlug] = useState("");
	const [slugEdited, setSlugEdited] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const { isPending, mutate } = usePostCompanies();

	const effectiveSlug = slugEdited ? slug : slugify(name);

	return (
		<form
			className="flex flex-col gap-4 rounded-lg border border-border bg-card p-4 sm:flex-row sm:items-end"
			onSubmit={event => {
				event.preventDefault();
				setError(null);
				mutate(
					{ data: { name, slug: effectiveSlug } },
					{
						onError: caught => {
							const taken = caught.status === 409;
							setError(taken ? t("admin.companies.create.slugTaken") : t("admin.companies.create.error"));
						},
						onSuccess: async () => {
							setName("");
							setSlug("");
							setSlugEdited(false);
							await queryClient.invalidateQueries({ queryKey: getCompaniesQueryKey() });
						},
					},
				);
			}}
		>
			<Label className="flex-1">
				{t("admin.companies.create.name")}
				<Input
					onChange={event => setName(event.currentTarget.value)}
					placeholder={t("admin.companies.create.namePlaceholder")}
					required
					value={name}
				/>
			</Label>
			<Label className="flex-1">
				{t("admin.companies.create.slug")}
				<Input
					onChange={event => {
						setSlugEdited(true);
						setSlug(event.currentTarget.value);
					}}
					placeholder={t("admin.companies.create.slugPlaceholder")}
					value={effectiveSlug}
				/>
			</Label>
			<Button disabled={isPending || !name} type="submit">
				{isPending ? t("admin.companies.create.submitting") : t("admin.companies.create.submit")}
			</Button>

			{error && <p className="text-destructive text-xs sm:w-full">{error}</p>}
		</form>
	);
}
