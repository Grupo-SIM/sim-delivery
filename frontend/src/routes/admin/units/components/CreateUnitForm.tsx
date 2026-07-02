import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { getUnitsQueryKey, usePostUnits } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function CreateUnitForm() {
	const { t } = useTranslation();
	const queryClient = useQueryClient();
	const [name, setName] = useState("");
	const [phone, setPhone] = useState("");
	const [error, setError] = useState<string | null>(null);

	const { isPending, mutate } = usePostUnits();

	return (
		<form
			className="flex flex-col gap-4 rounded-lg border border-border bg-card p-4 sm:flex-row sm:items-end"
			onSubmit={event => {
				event.preventDefault();
				setError(null);
				mutate(
					{ data: { name, phone: phone || null } },
					{
						onError: () => setError(t("admin.units.create.error")),
						onSuccess: async () => {
							setName("");
							setPhone("");
							await queryClient.invalidateQueries({ queryKey: getUnitsQueryKey() });
						},
					},
				);
			}}
		>
			<Label className="flex-1">
				{t("admin.units.create.name")}
				<Input
					onChange={event => setName(event.currentTarget.value)}
					placeholder={t("admin.units.create.namePlaceholder")}
					required
					value={name}
				/>
			</Label>
			<Label className="flex-1">
				{t("admin.units.create.phone")}
				<Input
					onChange={event => setPhone(event.currentTarget.value)}
					placeholder={t("admin.units.create.phonePlaceholder")}
					value={phone}
				/>
			</Label>
			<Button disabled={isPending || !name} type="submit">
				{isPending ? t("admin.units.create.submitting") : t("admin.units.create.submit")}
			</Button>

			{error && <p className="text-destructive text-xs sm:w-full">{error}</p>}
		</form>
	);
}
