import { useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/Checkbox";
import { CollapsibleFormSection } from "@/components/ui/CollapsibleFormSection";
import { CustomSelect } from "@/components/ui/CustomSelect";
import { Input } from "@/components/ui/input";
import { Label, RequiredMark } from "@/components/ui/label";
import { MediaUrlInput } from "@/components/ui/MediaUrlInput";
import { NumericInput } from "@/components/ui/NumericInput";
import { useDebouncedInput } from "@/hooks/use-debounced-input";
import {
	getProductsQueryKey,
	useGetCategories,
	useGetUnits,
	usePostProducts,
	usePutProductsByProductIdCategory,
	usePutProductsByProductIdUnits,
} from "@/lib/api";

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
	const [categoryId, setCategoryId] = useState("");
	const [unitIds, setUnitIds] = useState<string[]>([]);
	const [error, setError] = useState<string | null>(null);
	const [isUploadingImage, setIsUploadingImage] = useState(false);

	const { data: categories } = useGetCategories();
	const { data: units } = useGetUnits();
	const { isPending, mutate } = usePostProducts();
	const { mutateAsync: setProductUnits } = usePutProductsByProductIdUnits();
	const { mutateAsync: setProductCategory } = usePutProductsByProductIdCategory();
	const categoryOptions = [
		{ label: t("admin.unitProducts.form.loose"), value: "" },
		...(categories ?? []).map(category => ({ label: category.name, value: category.id })),
	];

	function toggleUnit(unitId: string) {
		setUnitIds(current =>
			current.includes(unitId) ? current.filter(id => id !== unitId) : [...current, unitId],
		);
	}

	const hasData = useMemo(
		() =>
			localTitle.trim() !== "" ||
			localImageUrl.trim() !== "" ||
			localDescription.trim() !== "" ||
			priceReais > 0 ||
			cashbackEnabled ||
			cashback > 0 ||
			categoryId !== "" ||
			unitIds.length > 0,
		[localTitle, localImageUrl, localDescription, priceReais, cashbackEnabled, cashback, categoryId, unitIds],
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
							description: localDescription,
							imageUrl: localImageUrl,
							title: localTitle,
						},
					},
					{
						onError: () => setError(t("admin.products.create.error")),
						onSuccess: async product => {
							if (unitIds.length > 0) {
								await setProductUnits({ data: { unitIds }, productId: product.id });
							}
							if (categoryId) {
								await setProductCategory({ data: { categoryId }, productId: product.id });
							}
							setTitle("");
							setImageUrl("");
							setDescription("");
							setPriceReais(0);
							setCashbackEnabled(false);
							setCashback(0);
							setCategoryId("");
							setUnitIds([]);
							await queryClient.invalidateQueries({ queryKey: getProductsQueryKey() });
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
						placeholder={t("admin.products.create.imagePlaceholder")}
						uploadLabel={t("admin.products.create.imageUpload")}
						value={imageUrl}
					/>
				</Label>
			</div>

			<CollapsibleFormSection expanded={hasData}>
				<div className="grid gap-4 md:grid-cols-2">
					<div>
						<span className="font-medium text-sm">
							{t("admin.products.create.price")} <RequiredMark />
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

				<div className="grid gap-4 md:grid-cols-2">
					<div>
						<span className="font-medium text-sm">{t("admin.products.create.category")}</span>
						<CustomSelect onChange={setCategoryId} options={categoryOptions} value={categoryId} />
					</div>

					{units && units.length > 0 && (
						<div className="space-y-2">
							<span className="font-medium text-sm">{t("admin.products.create.units")}</span>
							<div className="flex flex-wrap gap-3">
								{units.map(unit => (
									<div className="flex items-center gap-2 text-sm" key={unit.id}>
										<Checkbox
											checked={unitIds.includes(unit.id)}
											id={`create-product-unit-${unit.id}`}
											onChange={() => toggleUnit(unit.id)}
										/>
										<label htmlFor={`create-product-unit-${unit.id}`}>{unit.name}</label>
									</div>
								))}
							</div>
						</div>
					)}
				</div>
			</CollapsibleFormSection>

			<div className="flex items-center gap-3">
				<Button disabled={isPending || isUploadingImage || !localTitle || priceReais <= 0} type="submit">
					{isPending ? t("admin.products.create.submitting") : t("admin.products.create.submit")}
				</Button>
				{error && <p className="text-destructive text-xs">{error}</p>}
			</div>
		</form>
	);
}
