import { useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { CollapsibleFormSection } from "@/components/ui/CollapsibleFormSection";
import { ColorField } from "@/components/ui/ColorField";
import { Input } from "@/components/ui/input";
import { Label, RequiredMark } from "@/components/ui/label";
import { useDebouncedInput } from "@/hooks/use-debounced-input";
import { getTagsQueryKey, usePostTags } from "@/lib/api";

const DEFAULT_COLOR = "#22c55e";

export function CreateTagForm() {
	const { t } = useTranslation();
	const queryClient = useQueryClient();
	const [name, setName] = useState("");
	const [localName, setLocalName, flushName] = useDebouncedInput(name, setName);
	const [color, setColor] = useState(DEFAULT_COLOR);
	const [error, setError] = useState<string | null>(null);

	const hasData = useMemo(() => !!localName || color !== DEFAULT_COLOR, [localName, color]);

	const { isPending, mutate } = usePostTags();

	return (
		<form
			className="group flex flex-col gap-4 rounded-lg border border-border bg-card p-4 text-card-foreground sm:flex-row sm:items-end"
			onSubmit={event => {
				event.preventDefault();
				flushName();
				setError(null);
				mutate(
					{ data: { color, name: localName } },
					{
						onError: () => setError(t("admin.tags.create.error")),
						onSuccess: async () => {
							setName("");
							setColor(DEFAULT_COLOR);
							await queryClient.invalidateQueries({ queryKey: getTagsQueryKey() });
						},
					},
				);
			}}
		>
			<Label className="flex-1">
				<span>
					{t("admin.tags.create.name")} <RequiredMark />
				</span>
				<Input
					onBlur={flushName}
					onChange={event => setLocalName(event.currentTarget.value)}
					placeholder={t("admin.tags.create.namePlaceholder")}
					required
					value={localName}
				/>
			</Label>
			<CollapsibleFormSection expanded={hasData} visibleFrom="sm">
				<div className="flex flex-col gap-2">
					<span className="font-medium text-sm">{t("admin.tags.create.color")}</span>
					<ColorField onChange={setColor} value={color} />
				</div>
			</CollapsibleFormSection>
			<Button disabled={isPending || !localName} type="submit">
				{isPending ? t("admin.tags.create.submitting") : t("admin.tags.create.submit")}
			</Button>

			{error && <p className="text-destructive text-xs sm:w-full">{error}</p>}
		</form>
	);
}
