import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { LuPencil, LuStore, LuTrash2 } from "react-icons/lu";
import { Button } from "@/components/ui/button";
import { getProductsQueryKey, useDeleteProductsByProductId } from "@/lib/api";
import { showAlert, showConfirm } from "@/stores";
import { ProductEditModal } from "./ProductEditModal";
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
	const remove = useDeleteProductsByProductId();

	async function del() {
		if (!(await showConfirm(t("admin.products.row.deleteConfirm", { title: product.title })))) {
			return;
		}
		remove.mutate(
			{ productId: product.id },
			{
				onError: () => void showAlert(t("admin.products.row.deleteError")),
				onSuccess: () => queryClient.invalidateQueries({ queryKey: getProductsQueryKey() }),
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
				<td className="px-4 py-3 text-right">
					<div className="flex justify-end gap-2">
						<Button onClick={() => setManagingUnits(true)} size="sm" type="button" variant="outline">
							<LuStore className="h-4 w-4" />
							{t("admin.products.units.action")}
						</Button>
						<Button onClick={() => setEditing(true)} size="sm" type="button" variant="outline">
							<LuPencil className="h-4 w-4" />
							{t("admin.products.edit.action")}
						</Button>
						<Button disabled={remove.isPending} onClick={del} size="sm" type="button" variant="outline">
							<LuTrash2 className="h-4 w-4" />
							{t("admin.products.row.delete")}
						</Button>
					</div>
				</td>
			</tr>
			<ProductEditModal onClose={() => setEditing(false)} product={editing ? product : null} />
			<ProductUnitsModal onClose={() => setManagingUnits(false)} product={managingUnits ? product : null} />
		</>
	);
}
