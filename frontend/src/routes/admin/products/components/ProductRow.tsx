import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { LuPencil, LuStore, LuTags, LuTrash2 } from "react-icons/lu";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmActionButton } from "@/components/ui/ConfirmActionButton";
import { Tooltip } from "@/components/ui/Tooltip";
import { getProductsQueryKey, useDeleteProductsByProductId } from "@/lib/api";
import { showAlert, showToast } from "@/stores";
import { ProductEditModal } from "./ProductEditModal";
import { ProductTaxonomyModal } from "./ProductTaxonomyModal";
import { ProductUnitsModal } from "./ProductUnitsModal";
import type { Product } from "./types";

interface ProductRowProps {
	product: Product;
}

const money = new Intl.NumberFormat("pt-BR", { currency: "BRL", style: "currency" });

export function ProductRow({ product }: ProductRowProps) {
	const { t } = useTranslation();
	const queryClient = useQueryClient();
	const [editing, setEditing] = useState(false);
	const [managingUnits, setManagingUnits] = useState(false);
	const [managingTaxonomy, setManagingTaxonomy] = useState(false);
	const remove = useDeleteProductsByProductId();

	function del() {
		remove.mutate(
			{ productId: product.id },
			{
				onError: () => void showAlert(t("admin.products.row.deleteError")),
				onSuccess: () => {
					void queryClient.invalidateQueries({ queryKey: getProductsQueryKey() });
					showToast(t("admin.products.row.deleteSuccess"), "positive");
				},
			},
		);
	}

	return (
		<>
			<tr className="border-border/60 border-b last:border-0">
				<td className="px-4 py-3">
					<div className="flex items-center gap-3">
						{product.imageUrl && (
							<img
								alt=""
								className="h-12 w-12 rounded border border-border object-cover"
								src={product.imageUrl}
							/>
						)}
						<div>
							<p className="font-medium">{product.title}</p>
							<p className="line-clamp-1 text-muted-foreground text-xs">{product.description}</p>
						</div>
					</div>
				</td>
				<td className="px-4 py-3 text-muted-foreground">
					{money.format(Number(product.basePriceCents) / 100)}
				</td>
				<td className="px-4 py-3 text-muted-foreground">
					{product.cashbackPercentOverride === null
						? t("admin.products.row.unitDefault")
						: t("admin.products.row.cashbackPercent", { value: product.cashbackPercentOverride })}
				</td>
				<td className="px-4 py-3">
					<div className="flex max-w-56 flex-wrap gap-1">
						{product.categories.length === 0 ? (
							<span className="text-muted-foreground text-xs">{t("admin.products.row.none")}</span>
						) : (
							product.categories.map(category => (
								<Badge key={category.id} tone="neutral">
									{category.name}
								</Badge>
							))
						)}
					</div>
				</td>
				<td className="px-4 py-3">
					<div className="flex max-w-56 flex-wrap gap-1">
						{product.tags.length === 0 ? (
							<span className="text-muted-foreground text-xs">{t("admin.products.row.none")}</span>
						) : (
							product.tags.map(tag => (
								<Badge key={tag.id} style={{ borderColor: tag.color, color: tag.color }}>
									{tag.name}
								</Badge>
							))
						)}
					</div>
				</td>
				<td className="px-4 py-3 text-right">
					<div className="flex justify-end gap-2">
						<Tooltip content={t("admin.products.units.action")}>
							<Button
								aria-label={t("admin.products.units.action")}
								onClick={() => setManagingUnits(true)}
								size="icon"
								type="button"
								variant="outline"
							>
								<LuStore className="h-4 w-4" />
							</Button>
						</Tooltip>
						<Tooltip content={t("admin.products.edit.action")}>
							<Button
								aria-label={t("admin.products.edit.action")}
								onClick={() => setEditing(true)}
								size="icon"
								type="button"
								variant="outline"
							>
								<LuPencil className="h-4 w-4" />
							</Button>
						</Tooltip>
						<Tooltip content={t("admin.products.taxonomy.action")}>
							<Button
								aria-label={t("admin.products.taxonomy.action")}
								onClick={() => setManagingTaxonomy(true)}
								size="icon"
								type="button"
								variant="outline"
							>
								<LuTags className="h-4 w-4" />
							</Button>
						</Tooltip>
						<ConfirmActionButton
								aria-label={t("admin.products.row.delete")}
								confirmation={t("admin.products.row.deleteConfirm", { title: product.title })}
								confirmLabel={t("admin.products.row.delete")}
								disabled={remove.isPending}
								idleIcon={<LuTrash2 className="h-4 w-4" />}
								onConfirm={del}
								size="icon"
								type="button"
								variant="outline"
							>
								{null}
							</ConfirmActionButton>
					</div>
				</td>
			</tr>
			<ProductEditModal onClose={() => setEditing(false)} product={editing ? product : null} />
			<ProductUnitsModal onClose={() => setManagingUnits(false)} product={managingUnits ? product : null} />
			<ProductTaxonomyModal
				onClose={() => setManagingTaxonomy(false)}
				product={managingTaxonomy ? product : null}
			/>
		</>
	);
}
