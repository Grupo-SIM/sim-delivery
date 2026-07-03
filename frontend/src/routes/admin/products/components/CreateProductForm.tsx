import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NumericInput } from "@/components/ui/NumericInput";
import { useDebouncedInput } from "@/hooks/use-debounced-input";
import { getProductsQueryKey, usePostProducts } from "@/lib/api";

export function CreateProductForm() {
	const { t } = useTranslation();
	const queryClient = useQueryClient();
	const [title, setTitle] = useState("");
	const [localTitle, setLocalTitle, flushTitle] = useDebouncedInput(title, setTitle);
	const [imageUrl, setImageUrl] = useState("");
	const [localImageUrl, setLocalImageUrl, flushImageUrl] = useDebouncedInput(imageUrl, setImageUrl);
	const [description, setDescription] = useState("");
	const [localDescription, setLocalDescription, flushDescription] = useDebouncedInput(
		description,
		setDescription,
	);
	const [priceReais, setPriceReais] = useState(0);
	const [cashbackEnabled, setCashbackEnabled] = useState(false);
	const [cashback, setCashback] = useState(0);
	const [error, setError] = useState<string | null>(null);

	const { isPending, mutate } = usePostProducts();

	function flushText() {
		flushTitle();
		flushImageUrl();
		flushDescription();
	}

	return (
		<form
			className="grid gap-4 rounded-lg border border-border bg-card p-4 md:grid-cols-2"
			onSubmit={event => {
				event.preventDefault();
				flushText();
				setError(null);
				mutate(
					{
						data: {
							basePriceCents: Math.round(priceReais * 100),
							cashbackPercentOverride: cashbackEnabled ? cashback : null,
							description: localDescription,
							imageUrl: localImageUrl,
							title: localTitle,
						},
					},
					{
						onError: () => setError(t("admin.products.create.error")),
						onSuccess: async () => {
							setTitle("");
							setImageUrl("");
							setDescription("");
							setPriceReais(0);
							setCashbackEnabled(false);
							setCashback(0);
							await queryClient.invalidateQueries({ queryKey: getProductsQueryKey() });
						},
					},
				);
			}}
		>
			<Label>
				{t("admin.products.create.title")}
				<Input
					onBlur={flushTitle}
					onChange={event => setLocalTitle(event.currentTarget.value)}
					placeholder={t("admin.products.create.titlePlaceholder")}
					required
					value={localTitle}
				/>
			</Label>

			<Label>
				{t("admin.products.create.imageUrl")}
				<Input
					onBlur={flushImageUrl}
					onChange={event => setLocalImageUrl(event.currentTarget.value)}
					placeholder={t("admin.products.create.imageUrlPlaceholder")}
					required
					value={localImageUrl}
				/>
			</Label>

			<div>
				<span className="font-medium text-sm">{t("admin.products.create.price")}</span>
				<NumericInput
					decimalScale={2}
					decimalSeparator=","
					fixedDecimalScale
					onValueChange={({ floatValue }) => setPriceReais(floatValue ?? 0)}
					placeholder="R$ 18,90"
					prefix="R$ "
					thousandSeparator="."
					value={priceReais}
				/>
			</div>

			<div className="space-y-2">
				<label className="flex items-center gap-2 font-medium text-sm">
					<input
						checked={cashbackEnabled}
						onChange={event => setCashbackEnabled(event.currentTarget.checked)}
						type="checkbox"
					/>
					{t("admin.products.create.cashbackOverride")}
				</label>
				<NumericInput
					decimalScale={2}
					decimalSeparator=","
					disabled={!cashbackEnabled}
					onValueChange={({ floatValue }) => setCashback(floatValue ?? 0)}
					placeholder="5 %"
					suffix=" %"
					value={cashback}
				/>
			</div>

			<Label className="md:col-span-2">
				{t("admin.products.create.description")}
				<textarea
					className="flex min-h-24 w-full rounded border border-input bg-surface px-3 py-2 text-sm transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
					onBlur={flushDescription}
					onChange={event => setLocalDescription(event.currentTarget.value)}
					placeholder={t("admin.products.create.descriptionPlaceholder")}
					value={localDescription}
				/>
			</Label>

			<div className="flex items-center gap-3 md:col-span-2">
				<Button disabled={isPending || !localTitle || !localImageUrl || priceReais <= 0} type="submit">
					{isPending ? t("admin.products.create.submitting") : t("admin.products.create.submit")}
				</Button>
				{error && <p className="text-destructive text-xs">{error}</p>}
			</div>
		</form>
	);
}
