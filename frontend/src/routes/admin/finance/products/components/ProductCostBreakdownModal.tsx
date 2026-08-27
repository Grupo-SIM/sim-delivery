import { useTranslation } from "react-i18next";
import { DataTable } from "@/components/ui/DataTable";
import { Modal } from "@/components/ui/Modal";

interface Ingredient {
	costCents: number;
	costSharePercent: number;
	inventoryItemId: string;
	name: string;
	quantity: number;
	unit: string;
	unitCostCents: number;
}

interface ProductCostBreakdownModalProps {
	formatCents: (value: number) => string;
	onClose: () => void;
	product: {
		grossMarginPercent: number | null;
		ingredients: Ingredient[];
		priceCents: number | null;
		productName: string;
		theoreticalCostCents: number | null;
		theoreticalMarginPercent: number | null;
	} | null;
}

export function ProductCostBreakdownModal({ formatCents, onClose, product }: ProductCostBreakdownModalProps) {
	const { t } = useTranslation();

	return (
		<Modal
			isOpen={product !== null}
			onClose={onClose}
			title={product?.productName}
			urlKey="product-cost-breakdown"
			urlState={product?.productName}
		>
			{product && (
				<div className="space-y-4">
					<div className="grid gap-4 sm:grid-cols-3">
						<div>
							<p className="text-muted-foreground text-xs uppercase">
								{t("admin.reports.finance.products.currentPrice")}
							</p>
							<p className="mt-1 font-bold text-lg">
								{product.priceCents === null ? "—" : formatCents(product.priceCents)}
							</p>
						</div>
						<div>
							<p className="text-muted-foreground text-xs uppercase">
								{t("admin.reports.finance.products.theoreticalMargin")}
							</p>
							<p className="mt-1 font-bold text-lg">
								{product.theoreticalMarginPercent === null
									? t("admin.reports.finance.products.noRecipe")
									: `${product.theoreticalMarginPercent.toFixed(1)}%`}
							</p>
						</div>
						<div>
							<p className="text-muted-foreground text-xs uppercase">
								{t("admin.reports.finance.products.realizedMargin")}
							</p>
							<p className="mt-1 font-bold text-lg">
								{product.grossMarginPercent === null
									? t("admin.reports.summary.noKnownCost")
									: `${product.grossMarginPercent.toFixed(1)}%`}
							</p>
						</div>
					</div>

					<div>
						<h3 className="mb-2 font-medium text-sm">{t("admin.reports.finance.products.ingredients")}</h3>
						{product.ingredients.length === 0 ? (
							<p className="rounded-md border border-border bg-muted/40 p-4 text-muted-foreground text-sm">
								{t("admin.reports.finance.products.noRecipeHint")}
							</p>
						) : (
							<DataTable tableClassName="!min-w-0 table-fixed">
								<thead>
									<tr className="border-border border-b text-left text-muted-foreground">
										<th className="p-3">{t("admin.reports.finance.products.columns.ingredient")}</th>
										<th className="p-3 text-right">{t("admin.reports.finance.products.columns.quantity")}</th>
										<th className="p-3 text-right">{t("admin.reports.finance.products.columns.cost")}</th>
										<th className="p-3 text-right">{t("admin.reports.finance.products.columns.share")}</th>
									</tr>
								</thead>
								<tbody>
									{product.ingredients.map(ingredient => (
										<tr className="border-border/60 border-b last:border-0" key={ingredient.inventoryItemId}>
											<td className="p-3 font-medium">{ingredient.name}</td>
											<td className="p-3 text-right">
												{ingredient.quantity} {ingredient.unit}
											</td>
											<td className="p-3 text-right">{formatCents(ingredient.costCents)}</td>
											<td className="p-3 text-right">{ingredient.costSharePercent.toFixed(1)}%</td>
										</tr>
									))}
								</tbody>
							</DataTable>
						)}
					</div>
				</div>
			)}
		</Modal>
	);
}
