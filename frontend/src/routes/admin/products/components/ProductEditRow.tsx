import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MediaUrlInput } from "@/components/ui/MediaUrlInput";
import { NumericInput } from "@/components/ui/NumericInput";
import { useDebouncedInput } from "@/hooks/use-debounced-input";
import { getProductsQueryKey, usePatchProductsByProductId } from "@/lib/api";
import type { Product } from "./types";

interface ProductEditRowProps {
	onCancel: () => void;
	product: Product;
}

export function ProductEditRow({ onCancel, product }: ProductEditRowProps) {
	const { t } = useTranslation();
	const queryClient = useQueryClient();
	const [title, setTitle] = useState(product.title);
	const [localTitle, setLocalTitle, flushTitle] = useDebouncedInput(title, setTitle);
	const [imageUrl, setImageUrl] = useState(product.imageUrl);
	const [localImageUrl, setLocalImageUrl, flushImageUrl] = useDebouncedInput(imageUrl, setImageUrl);
	const [description, setDescription] = useState(product.description);
	const [localDescription, setLocalDescription, flushDescription] = useDebouncedInput(
		description,
		setDescription,
	);
	const [priceReais, setPriceReais] = useState(Number(product.basePriceCents) / 100);
	const [cashbackEnabled, setCashbackEnabled] = useState(product.cashbackPercentOverride !== null);
	const [cashback, setCashback] = useState(product.cashbackPercentOverride ?? 0);
	const [error, setError] = useState<string | null>(null);
	const [isUploadingImage, setIsUploadingImage] = useState(false);

	const { isPending, mutate } = usePatchProductsByProductId();

	function save() {
		flushTitle();
		flushImageUrl();
		flushDescription();
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
				productId: product.id,
			},
			{
				onError: () => setError(t("admin.products.edit.error")),
				onSuccess: async () => {
					await queryClient.invalidateQueries({ queryKey: getProductsQueryKey() });
					onCancel();
				},
			},
		);
	}

	return (
		<tr className="border-border/60 border-b last:border-0">
			<td className="px-4 py-3" colSpan={5}>
				<div className="grid gap-4 md:grid-cols-2">
					<Input
						onBlur={flushTitle}
						onChange={event => setLocalTitle(event.currentTarget.value)}
						placeholder={t("admin.products.create.titlePlaceholder")}
						value={localTitle}
					/>
					<MediaUrlInput
						asset="product"
						onUploadError={() => setError(t("admin.products.create.uploadError"))}
						onUploadingChange={setIsUploadingImage}
						onValueChange={setImageUrl}
						placeholder={t("admin.products.create.imagePlaceholder")}
						uploadLabel={t("admin.products.create.imageUpload")}
						value={imageUrl}
					/>
					<NumericInput
						decimalScale={2}
						decimalSeparator=","
						onValueChange={({ floatValue }) => setPriceReais(floatValue ?? 0)}
						placeholder="R$ 18,90"
						prefix="R$ "
						thousandSeparator="."
						value={priceReais}
					/>
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
					<textarea
						className="flex min-h-24 w-full rounded border border-input bg-surface px-3 py-2 text-sm transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 md:col-span-2"
						onBlur={flushDescription}
						onChange={event => setLocalDescription(event.currentTarget.value)}
						placeholder={t("admin.products.create.descriptionPlaceholder")}
						value={localDescription}
					/>
				</div>
				{error && <p className="mt-2 text-destructive text-xs">{error}</p>}
				<div className="mt-4 flex justify-end gap-2">
					<Button disabled={isPending} onClick={onCancel} type="button" variant="outline">
						{t("admin.products.edit.cancel")}
					</Button>
					<Button
						disabled={isPending || isUploadingImage || !localTitle || priceReais <= 0}
						onClick={save}
						type="button"
					>
						{isPending ? t("admin.products.edit.saving") : t("admin.products.edit.save")}
					</Button>
				</div>
			</td>
		</tr>
	);
}
