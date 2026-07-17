import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getUnitsByUnitIdProductsQueryKey, useDeleteUnitsByUnitIdProductsByUnitProductId } from "@/lib/api";
import { showAlert, showConfirm } from "@/stores";
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

	const product = products.find(p => p.id === association.productId);
	const effectiveCategories = association.categoriesOverridden
		? categories.filter(category => association.categoryIds.includes(category.id))
		: (product?.categories ?? []);
	const effectiveTags = association.tagsOverridden
		? tags.filter(tag => association.tagIds.includes(tag.id))
		: (product?.tags ?? []);
	const priceCents = Number(association.priceCentsOverride ?? product?.basePriceCents ?? 0);

	async function del() {
		if (!(await showConfirm(t("admin.unitProducts.row.removeConfirm", { title: product?.title ?? "" })))) {
			return;
		}
		remove.mutate(
			{ unitId, unitProductId: association.id },
			{
				onError: () => void showAlert(t("admin.unitProducts.row.removeError")),
				onSuccess: () =>
					queryClient.invalidateQueries({ queryKey: getUnitsByUnitIdProductsQueryKey(unitId) }),
			},
		);
	}

	return (
		<>
			<tr className="border-border/60 border-b last:border-0">
				<td className="px-4 py-3 font-medium">{product?.title ?? association.productId}</td>
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
					{association.priceCentsOverride !== null && (
						<span className="ml-1 text-xs">{t("admin.unitProducts.row.overridden")}</span>
					)}
				</td>
				<td className="px-4 py-3">
					<Badge
						className={
							association.available
								? "border-green-500/30 bg-green-500/10 text-green-500"
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
						<Button onClick={() => setEditing(true)} size="sm" type="button" variant="outline">
							{t("admin.unitProducts.row.edit")}
						</Button>
						<Button disabled={remove.isPending} onClick={del} size="sm" type="button" variant="outline">
							{t("admin.unitProducts.row.remove")}
						</Button>
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
