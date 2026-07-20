import { useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/Checkbox";
import { CollapsibleFormSection } from "@/components/ui/CollapsibleFormSection";
import { FormSectionHeading } from "@/components/ui/FormSectionHeading";
import { Input } from "@/components/ui/input";
import { Label, RequiredMark } from "@/components/ui/label";
import { MediaUrlInput } from "@/components/ui/MediaUrlInput";
import { NumericInput } from "@/components/ui/NumericInput";
import { useDebouncedInput } from "@/hooks/use-debounced-input";
import { getProductsQueryKey, useGetCategories, useGetTags, useGetUnits, usePostProducts } from "@/lib/api";
import { CreateProductCategoriesModal } from "./CreateProductCategoriesModal";
import { CreateProductTagsModal } from "./CreateProductTagsModal";
import { CreateProductUnitsModal } from "./CreateProductUnitsModal";

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
	const [categoryIds, setCategoryIds] = useState<string[]>([]);
	const [tagIds, setTagIds] = useState<string[]>([]);
	const [unitIds, setUnitIds] = useState<string[] | null>(null);
	const [isCategoriesModalOpen, setIsCategoriesModalOpen] = useState(false);
	const [isTagsModalOpen, setIsTagsModalOpen] = useState(false);
	const [isUnitsModalOpen, setIsUnitsModalOpen] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [isUploadingImage, setIsUploadingImage] = useState(false);

	const { isPending, mutate } = usePostProducts();
	const categoriesQuery = useGetCategories();
	const tagsQuery = useGetTags();
	const unitsQuery = useGetUnits();

	const categoryNames = categoriesQuery.data
		?.filter(category => categoryIds.includes(category.id))
		.map(category => category.name);
	const tagNames = tagsQuery.data?.filter(tag => tagIds.includes(tag.id)).map(tag => tag.name);
	const unitNames = unitsQuery.data?.filter(unit => unitIds?.includes(unit.id)).map(unit => unit.name);

	const hasData = useMemo(
		() =>
			localTitle.trim() !== "" ||
			localImageUrl.trim() !== "" ||
			localDescription.trim() !== "" ||
			priceReais > 0 ||
			cashbackEnabled ||
			cashback > 0 ||
			categoryIds.length > 0 ||
			tagIds.length > 0 ||
			unitIds !== null,
		[
			localTitle,
			localImageUrl,
			localDescription,
			priceReais,
			cashbackEnabled,
			cashback,
			categoryIds,
			tagIds,
			unitIds,
		],
	);

	function flushText() {
		flushTitle();
		flushImageUrl();
		flushDescription();
	}

	return (
		<form
			className="group space-y-4 rounded-lg border border-border bg-card p-4"
			onSubmit={event => {
				event.preventDefault();
				flushText();
				setError(null);
				mutate(
					{
						data: {
							basePriceCents: Math.round(priceReais * 100),
							cashbackPercentOverride: cashbackEnabled ? cashback : null,
							categoryIds,
							description: localDescription,
							imageUrl: localImageUrl,
							tagIds,
							title: localTitle,
							...(unitIds === null ? {} : { unitIds }),
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
							setCategoryIds([]);
							setTagIds([]);
							setUnitIds(null);
							await queryClient.invalidateQueries({
								queryKey: getProductsQueryKey(),
							});
						},
					},
				);
			}}
		>
			<div className="grid gap-4 md:grid-cols-2">
				<Label>
					<span>
						{t("admin.products.create.title")} <RequiredMark />
					</span>
					<Input
						onBlur={flushTitle}
						onChange={event => setLocalTitle(event.currentTarget.value)}
						placeholder={t("admin.products.create.titlePlaceholder")}
						required
						value={localTitle}
					/>
				</Label>

				<Label>
					<span>{t("admin.products.create.image")}</span>
					<MediaUrlInput
						asset="product"
						onUploadError={() => setError(t("admin.products.create.uploadError"))}
						onUploadingChange={setIsUploadingImage}
						onValueChange={setImageUrl}
						uploadLabel={t("admin.products.create.imageUpload")}
						value={imageUrl}
					/>
				</Label>
			</div>

			<CollapsibleFormSection expanded={hasData}>
				<div className="grid gap-4 md:grid-cols-2">
					<div>
						<span className="font-medium text-sm">
						{t("admin.products.create.price")}
						</span>
						<NumericInput
							decimalScale={2}
							decimalSeparator=","
							onValueChange={({ floatValue }) => setPriceReais(floatValue ?? 0)}
							placeholder="R$ 18,90"
							prefix="R$ "
							thousandSeparator="."
							value={priceReais}
						/>
					</div>
					<div className="space-y-2">
						<label
							className="flex cursor-pointer items-center gap-2 font-medium text-sm"
							htmlFor="cashback-enabled"
						>
							<Checkbox
								checked={cashbackEnabled}
								id="cashback-enabled"
								onChange={() => setCashbackEnabled(value => !value)}
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
				</div>
				<Label>
					{t("admin.products.create.description")}
					<textarea
						className="flex min-h-24 w-full rounded border border-input bg-surface px-3 py-2 text-sm transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
						onBlur={flushDescription}
						onChange={event => setLocalDescription(event.currentTarget.value)}
						placeholder={t("admin.products.create.descriptionPlaceholder")}
						value={localDescription}
					/>
				</Label>
			</CollapsibleFormSection>

			<CollapsibleFormSection expanded={hasData}>
				<FormSectionHeading>{t("admin.products.create.configuration")}</FormSectionHeading>
				<div className="flex flex-wrap justify-start gap-6 pt-2">
					<div className="flex flex-col items-start gap-2">
						<span className="font-medium text-sm">{t("admin.products.create.categories")}</span>
						<Button onClick={() => setIsCategoriesModalOpen(true)} type="button" variant="outline">
							{categoryNames && categoryNames.length > 0
								? categoryNames.join(", ")
								: t("admin.products.create.categoriesPlaceholder")}
						</Button>
					</div>
					<div className="flex flex-col items-start gap-2">
						<span className="font-medium text-sm">{t("admin.products.create.tags")}</span>
						<Button onClick={() => setIsTagsModalOpen(true)} type="button" variant="outline">
							{tagNames && tagNames.length > 0 ? tagNames.join(", ") : t("admin.products.create.tagsPlaceholder")}
						</Button>
					</div>
					<div className="flex flex-col items-start gap-2">
						<span className="font-medium text-sm">{t("admin.products.create.units")}</span>
						<Button onClick={() => setIsUnitsModalOpen(true)} type="button" variant="outline">
							{unitIds === null
								? t("admin.products.create.unitsAll")
								: (unitNames?.join(", ") ?? t("admin.products.create.unitsAll"))}
						</Button>
					</div>
				</div>
			</CollapsibleFormSection>

			<div className="flex items-center justify-between gap-3">
				{error && <p className="text-destructive text-xs">{error}</p>}
				<Button className="ml-auto" disabled={isPending || isUploadingImage || !localTitle} type="submit">
					{isPending ? t("admin.products.create.submitting") : t("admin.products.create.submit")}
				</Button>
			</div>
			<CreateProductCategoriesModal
				isOpen={isCategoriesModalOpen}
				onClose={() => setIsCategoriesModalOpen(false)}
				onSave={ids => {
					setCategoryIds(ids);
					setIsCategoriesModalOpen(false);
				}}
				selectedCategoryIds={categoryIds}
			/>
			<CreateProductTagsModal
				isOpen={isTagsModalOpen}
				onClose={() => setIsTagsModalOpen(false)}
				onSave={ids => {
					setTagIds(ids);
					setIsTagsModalOpen(false);
				}}
				selectedTagIds={tagIds}
			/>
			<CreateProductUnitsModal
				isOpen={isUnitsModalOpen}
				onClose={() => setIsUnitsModalOpen(false)}
				onSave={ids => {
					setUnitIds(ids);
					setIsUnitsModalOpen(false);
				}}
				selectedUnitIds={unitIds}
			/>
		</form>
	);
}
