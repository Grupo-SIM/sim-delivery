import { useTranslation } from "react-i18next";
import { Modal } from "@/components/ui/Modal";
import type { GetOrders200 } from "@/lib/api";
import { formatMoney } from "@/lib/formatMoney";

interface CustomerOrderDetailsModalProps {
	onClose: () => void;
	order: GetOrders200[number] | null;
}

export function CustomerOrderDetailsModal({ onClose, order }: CustomerOrderDetailsModalProps) {
	const { t } = useTranslation();

	return (
		<Modal isOpen={order !== null} maxWidth="600px" onClose={onClose} title={t("admin.customers.orderDetails.title")}>
			{order && (
				<div className="space-y-5">
					<div className="grid gap-3 text-sm sm:grid-cols-2">
						<div>
							<p className="text-muted-foreground">{t("admin.customers.orderDetails.unit")}</p>
							<p className="mt-1 font-medium">{order.unitName}</p>
						</div>
						<div>
							<p className="text-muted-foreground">{t("admin.customers.orderDetails.status")}</p>
							<p className="mt-1 font-medium">{t(`admin.orders.status.${order.status}`, { defaultValue: order.status })}</p>
						</div>
						<div>
							<p className="text-muted-foreground">{t("admin.customers.orderDetails.date")}</p>
							<p className="mt-1 font-medium">{new Date(order.createdAt).toLocaleString("pt-BR")}</p>
						</div>
						<div>
							<p className="text-muted-foreground">{t("admin.customers.orderDetails.deliveryMethod")}</p>
							<p className="mt-1 font-medium">{t(`store.checkout.order.${order.deliveryMethod}`, { defaultValue: order.deliveryMethod })}</p>
						</div>
					</div>

					<section>
						<h3 className="font-semibold">{t("admin.customers.orderDetails.items")}</h3>
						<ul className="mt-3 divide-y divide-border rounded-lg border border-border">
							{order.items.map(item => (
								<li className="min-w-0 px-4 py-3" key={item.id}>
									<div className="flex min-w-0 items-start justify-between gap-4">
										<p className="break-words font-medium text-sm">{Number(item.quantity)}× {item.productName}</p>
										<span className="shrink-0 whitespace-nowrap font-semibold text-sm">{formatMoney(Number(item.total) / 100)}</span>
									</div>
									{item.note && <p className="mt-2 break-words rounded-md bg-muted px-3 py-2 text-muted-foreground text-xs leading-5">{item.note}</p>}
								</li>
							))}
						</ul>
					</section>

					<div className="flex justify-between border-border border-t pt-4 font-semibold">
						<span>{t("admin.customers.orderDetails.total")}</span>
						<span>{formatMoney(Number(order.total) / 100)}</span>
					</div>
				</div>
			)}
		</Modal>
	);
}
