import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getCategoriesQueryKey, usePostCategories } from "@/lib/api";

export function CreateCategoryForm() {
	const { t } = useTranslation();
	const queryClient = useQueryClient();
	const [name, setName] = useState("");
	const [error, setError] = useState<string | null>(null);

	const { isPending, mutate } = usePostCategories();

	return (
		<form
			className="flex flex-col gap-4 rounded-lg border border-border bg-card p-4 sm:flex-row sm:items-end"
			onSubmit={event => {
				event.preventDefault();
				setError(null);
				mutate(
					{ data: { name } },
					{
						onError: () => setError(t("admin.categories.create.error")),
						onSuccess: async () => {
							setName("");
							await queryClient.invalidateQueries({ queryKey: getCategoriesQueryKey() });
						},
					},
				);
			}}
		>
			<Label className="flex-1">
				{t("admin.categories.create.name")}
				<Input
					onChange={event => setName(event.currentTarget.value)}
					placeholder={t("admin.categories.create.namePlaceholder")}
					required
					value={name}
				/>
			</Label>
			<Button disabled={isPending || !name} type="submit">
				{isPending ? t("admin.categories.create.submitting") : t("admin.categories.create.submit")}
			</Button>

			{error && <p className="text-destructive text-xs sm:w-full">{error}</p>}
		</form>
	);
}
