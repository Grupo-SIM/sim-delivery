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
	const subtotal = order ? Number(order.subtotal) : 0;
	const deliveryFee = order ? Number(order.deliveryFee) : 0;
	const discount = order ? Number(order.discountCents) : 0;
	const cashbackRedeemed = order ? Number(order.cashbackCentsRedeemed) : 0;
	const loyaltyRedeemed = order ? Number(order.loyaltyPointsRedeemed) : 0;

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
						<ul className="mt-3 divide-y divide-border/70">
							{order.items.map(item => (
								<li className="min-w-0 py-4 first:pt-0 last:pb-0" key={item.id}>
									<div className="flex min-w-0 items-start justify-between gap-4">
										<p className="break-words font-medium text-sm">{Number(item.quantity)}× {item.productName}</p>
										<span className="shrink-0 whitespace-nowrap font-semibold text-sm">{formatMoney(Number(item.total) / 100)}</span>
									</div>
									{item.note && <p className="mt-3 break-words rounded-md border border-input bg-surface px-3 py-2 text-sm leading-5">{item.note}</p>}
								</li>
							))}
						</ul>
					</section>

					<section className="space-y-2 border-border border-t pt-4 text-sm">
						<div className="flex justify-between"><span className="text-muted-foreground">{t("store.checkout.order.itemsSubtotal")}</span><span>{formatMoney(subtotal / 100)}</span></div>
						{order.deliveryMethod === "delivery" && <div className="flex justify-between"><span className="text-muted-foreground">{t("store.cart.deliveryFee")}</span><span>{formatMoney(deliveryFee / 100)}</span></div>}
						{discount > 0 && <div className="flex justify-between text-green-700"><span>{t("store.checkout.order.discount")}</span><span>−{formatMoney(discount / 100)}</span></div>}
						{cashbackRedeemed > 0 && <div className="flex justify-between text-green-700"><span>{t("store.checkout.order.cashbackRedeemed")}</span><span>−{formatMoney(cashbackRedeemed / 100)}</span></div>}
						{loyaltyRedeemed > 0 && <div className="flex justify-between text-green-700"><span>{t("store.checkout.order.loyaltyRedeemed")}</span><span>−{formatMoney(loyaltyRedeemed / 100)}</span></div>}
						<div className="flex justify-between border-border border-t pt-3 font-bold text-base"><span>{t("admin.customers.orderDetails.total")}</span><span>{formatMoney(Number(order.total) / 100)}</span></div>
					</section>
				</div>
			)}
		</Modal>
	);
}
