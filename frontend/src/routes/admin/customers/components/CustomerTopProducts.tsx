import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import type { GetOrders200 } from "@/lib/api";

interface CustomerTopProductsProps {
	orders: GetOrders200;
}

export function CustomerTopProducts({ orders }: CustomerTopProductsProps) {
	const { t } = useTranslation();
	const products = useMemo(() => {
		const quantities = new Map<string, number>();
		for (const order of orders) {
			for (const item of order.items) {
				quantities.set(item.productName, (quantities.get(item.productName) ?? 0) + Number(item.quantity));
			}
		}
		return [...quantities.entries()]
			.map(([name, quantity]) => ({ name, quantity }))
			.sort((a, b) => b.quantity - a.quantity || a.name.localeCompare(b.name, "pt-BR"))
			.slice(0, 5);
	}, [orders]);

	return (
		<section className="space-y-3">
			<h2 className="font-semibold text-lg">{t("admin.customers.detail.topProducts")}</h2>
			{products.length === 0 ? (
				<p className="rounded-lg border border-border bg-card p-4 text-muted-foreground text-sm">
					{t("admin.customers.detail.emptyTopProducts")}
				</p>
			) : (
				<ol className="divide-y divide-border rounded-lg border border-border bg-card text-card-foreground">
					{products.map((product, index) => (
						<li className="flex items-center gap-3 px-4 py-3" key={product.name}>
							<span className="grid size-7 shrink-0 place-items-center rounded-full bg-primary/10 font-semibold text-primary text-xs">
								{index + 1}
							</span>
							<span className="min-w-0 flex-1 break-words font-medium text-sm">{product.name}</span>
							<span className="shrink-0 text-muted-foreground text-sm">
								{t("admin.customers.detail.productQuantity", { count: product.quantity })}
							</span>
						</li>
					))}
				</ol>
			)}
		</section>
	);
}
