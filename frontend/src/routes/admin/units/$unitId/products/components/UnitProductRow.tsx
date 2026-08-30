import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { LuCircleCheck, LuCircleX, LuPencil, LuTrash2 } from "react-icons/lu";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmActionButton } from "@/components/ui/ConfirmActionButton";
import {
	getUnitsByUnitIdProductsQueryKey,
	useDeleteUnitsByUnitIdProductsByUnitProductId,
	usePatchUnitsByUnitIdProductsByUnitProductId,
} from "@/lib/api";
import { showAlert, showToast } from "@/stores";
import { type Category, money, type Product, type Tag, type UnitProduct } from "./types";
import { UnitProductEditModal } from "./UnitProductEditModal";

interface UnitProductRowProps {
	association: UnitProduct;
	categories: Category[];
	products: Product[];
	tags: Tag[];
	unitId: string;
}

export function UnitProductRow({ association, categories, products, tags, unitId }: UnitProductRowProps) {
	const { t } = useTranslation();
	const queryClient = useQueryClient();
	const [editing, setEditing] = useState(false);
	const remove = useDeleteUnitsByUnitIdProductsByUnitProductId();
	const updateAvailability = usePatchUnitsByUnitIdProductsByUnitProductId();

	const product = products.find(p => p.id === association.productId);
	const effectiveCategories = association.categoriesOverridden
		? categories.filter(category => association.categoryIds.includes(category.id))
		: (product?.categories ?? []);
	const effectiveTags = association.tagsOverridden
		? tags.filter(tag => association.tagIds.includes(tag.id))
		: (product?.tags ?? []);
	const regularPriceCents = Number(association.priceCentsOverride ?? product?.basePriceCents ?? 0);
	const priceCents = Number(association.promotionalPriceCents ?? regularPriceCents);

	function del() {
		remove.mutate(
			{ unitId, unitProductId: association.id },
			{
				onError: () => void showAlert(t("admin.unitProducts.row.removeError")),
				onSuccess: () => {
					void queryClient.invalidateQueries({ queryKey: getUnitsByUnitIdProductsQueryKey(unitId) });
					showToast(t("admin.unitProducts.row.removeSuccess"), "positive");
				},
			},
		);
	}

	function toggleAvailability() {
		const available = !association.available;
		updateAvailability.mutate(
			{ data: { available }, unitId, unitProductId: association.id },
			{
				onError: () => void showAlert(t("admin.unitProducts.row.availabilityError")),
				onSuccess: () => {
					void queryClient.invalidateQueries({ queryKey: getUnitsByUnitIdProductsQueryKey(unitId) });
					showToast(
						t(
							available
								? "admin.unitProducts.row.availableSuccess"
								: "admin.unitProducts.row.unavailableSuccess",
							{ title: product?.title ?? association.productId },
						),
						"positive",
					);
				},
			},
		);
	}

	return (
		<>
			<tr className="border-border/60 border-b last:border-0">
				<td className="px-4 py-3 font-medium">
					<div className="flex items-center gap-3">
						{product?.imageUrl && (
							<img
								alt={product.title}
								className="size-12 shrink-0 rounded border border-border object-cover"
								src={product.imageUrl}
							/>
						)}
						<span>{product?.title ?? association.productId}</span>
					</div>
				</td>
				<td className="px-4 py-3 text-muted-foreground">
					<div className="flex flex-wrap gap-1">
						{effectiveCategories.map(category => (
							<Badge key={category.id} tone="neutral">
								{category.name}
							</Badge>
						))}
						{effectiveCategories.length === 0 && t("admin.unitProducts.row.none")}
						{association.categoriesOverridden && (
							<span className="text-xs">{t("admin.unitProducts.row.overridden")}</span>
						)}
					</div>
				</td>
				<td className="px-4 py-3 text-muted-foreground">
					<div className="flex flex-wrap gap-1">
						{effectiveTags.map(tag => (
							<Badge key={tag.id} style={{ borderColor: tag.color, color: tag.color }}>
								{tag.name}
							</Badge>
						))}
						{effectiveTags.length === 0 && t("admin.unitProducts.row.none")}
						{association.tagsOverridden && (
							<span className="text-xs">{t("admin.unitProducts.row.overridden")}</span>
						)}
					</div>
				</td>
				<td className="px-4 py-3 text-muted-foreground">
					{money.format(priceCents / 100)}
					{association.promotionalPriceCents !== null && (
						<Badge className="ml-2 border-success/30 bg-success/10 text-success">Promoção</Badge>
					)}
					{association.priceCentsOverride !== null && (
						<span className="ml-1 text-xs">{t("admin.unitProducts.row.overridden")}</span>
					)}
				</td>
				<td className="px-4 py-3">
					<Badge
						className={
							association.available
								? "border-success/30 bg-success/10 text-success"
								: "border-muted-foreground/30 bg-muted-foreground/10 text-muted-foreground"
						}
					>
						{association.available
							? t("admin.unitProducts.status.available")
							: t("admin.unitProducts.status.unavailable")}
					</Badge>
				</td>
				<td className="px-4 py-3 text-right">
					<div className="flex justify-end gap-2">
						<Button
							disabled={updateAvailability.isPending}
							onClick={toggleAvailability}
							size="sm"
							type="button"
							variant="outline"
						>
							{association.available ? <LuCircleX /> : <LuCircleCheck />}
							{association.available
								? t("admin.unitProducts.row.makeUnavailable")
								: t("admin.unitProducts.row.makeAvailable")}
						</Button>
						<Button onClick={() => setEditing(true)} size="sm" type="button" variant="outline">
							<LuPencil />
							{t("admin.unitProducts.row.edit")}
						</Button>
						<ConfirmActionButton
							confirmation={t("admin.unitProducts.row.removeConfirm", { title: product?.title ?? "" })}
							confirmLabel={t("admin.unitProducts.row.remove")}
							disabled={remove.isPending}
							onConfirm={del}
							size="sm"
							type="button"
							variant="outline"
						>
							<LuTrash2 />
							{t("admin.unitProducts.row.remove")}
						</ConfirmActionButton>
					</div>
				</td>
			</tr>
			<UnitProductEditModal
				association={editing ? association : null}
				categories={categories}
				onClose={() => setEditing(false)}
				product={product}
				tags={tags}
				unitId={unitId}
			/>
		</>
	);
}
