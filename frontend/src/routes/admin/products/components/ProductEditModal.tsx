import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { CustomSelect } from "@/components/ui/CustomSelect";
import { Input } from "@/components/ui/input";
import { Label, RequiredMark } from "@/components/ui/label";
import { MediaUrlInput } from "@/components/ui/MediaUrlInput";
import { Modal } from "@/components/ui/Modal";
import { NumericInput } from "@/components/ui/NumericInput";
import { useDebouncedInput } from "@/hooks/use-debounced-input";
import {
	getProductsByProductIdCategoryQueryKey,
	getProductsQueryKey,
	useGetCategories,
	useGetProductsByProductIdCategory,
	usePatchProductsByProductId,
	usePutProductsByProductIdCategory,
} from "@/lib/api";
import type { Product } from "./types";

interface ProductEditModalProps {
	onClose: () => void;
	product: Product | null;
}

export function ProductEditModal({ onClose, product }: ProductEditModalProps) {
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
	const [error, setError] = useState<string | null>(null);
	const [isUploadingImage, setIsUploadingImage] = useState(false);

	const { data: categories } = useGetCategories();
	const { data: currentCategory } = useGetProductsByProductIdCategory(product?.id);
	const { isPending, mutate } = usePatchProductsByProductId();
	const { mutateAsync: setProductCategory } = usePutProductsByProductIdCategory();
	const categoryOptions = [
		{ label: t("admin.unitProducts.form.loose"), value: "" },
		...(categories ?? []).map(category => ({ label: category.name, value: category.id })),
	];

	useEffect(() => {
		if (!product) {
			return;
		}
		setTitle(product.title);
		setImageUrl(product.imageUrl);
		setDescription(product.description);
		setPriceReais(Number(product.basePriceCents) / 100);
		setCashbackEnabled(product.cashbackPercentOverride !== null);
		setCashback(product.cashbackPercentOverride ?? 0);
		setError(null);
	}, [product]);

	useEffect(() => {
		setCategoryId(currentCategory?.categoryId ?? "");
	}, [currentCategory]);

	function save() {
		if (!product) {
			return;
		}
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
					await setProductCategory({ data: { categoryId: categoryId || null }, productId: product.id });
					await queryClient.invalidateQueries({ queryKey: getProductsQueryKey() });
					await queryClient.invalidateQueries({
						queryKey: getProductsByProductIdCategoryQueryKey(product.id),
					});
					onClose();
				},
			},
		);
	}

	return (
		<Modal isOpen={product !== null} onClose={onClose} title={t("admin.products.edit.title")}>
			<div className="space-y-4">
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

				<div>
					<span className="font-medium text-sm">{t("admin.products.create.category")}</span>
					<CustomSelect onChange={setCategoryId} options={categoryOptions} value={categoryId} />
				</div>

				{error && <p className="text-destructive text-xs">{error}</p>}
				<div className="flex justify-end gap-2">
					<Button disabled={isPending} onClick={onClose} type="button" variant="outline">
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
			</div>
		</Modal>
	);
}
