import { useTranslation } from "react-i18next";
import { LuCircleAlert, LuPencil } from "react-icons/lu";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/Modal";
import type { GetOrders200 } from "@/lib/api";
import { formatMoney } from "@/lib/formatMoney";

type OrderSummaryModalView = "customer" | "orders";

interface OrderSummaryModalProps {
	onEditEstimate?: () => void;
	onClose: () => void;
	order: GetOrders200[number] | null;
	view: OrderSummaryModalView;
}

export function OrderSummaryModal({ onClose, onEditEstimate, order, view }: OrderSummaryModalProps) {
	const { t } = useTranslation();
	const deadline = order?.estimatedStatusCompletionAt
		? new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit" }).format(
				new Date(order.estimatedStatusCompletionAt),
			)
		: "Sem previsão";
	const subtotal = order ? Number(order.subtotal) : 0;
	const deliveryFee = order ? Number(order.deliveryFee) : 0;
	const discount = order ? Number(order.discountCents) : 0;
	const cashbackRedeemed = order ? Number(order.cashbackCentsRedeemed) : 0;
	const loyaltyRedeemed = order ? Number(order.loyaltyPointsRedeemed) : 0;
	const couponDetail = order?.couponCode
		? order.couponType === "percent"
			? `${order.couponCode} · ${Number(order.couponValue)}%`
			: order.couponCode
		: null;
	const showCustomerFinancials = view === "customer";
	const showOrderOperations = view === "orders";

	return (
		<Modal
			isOpen={order !== null}
			maxWidth="600px"
			onClose={onClose}
			title={t("admin.customers.orderDetails.title")}
			urlKey="order-summary"
			urlState={order?.id}
		>
			{order && (
				<div className="space-y-5">
					<div className="grid gap-3 text-sm sm:grid-cols-2">
						<div>
							<p className="text-muted-foreground">{t("admin.customers.orderDetails.unit")}</p>
							<p className="mt-1 font-medium">{order.unitName}</p>
						</div>
						<div>
							<p className="text-muted-foreground">{t("admin.customers.orderDetails.status")}</p>
							<p className="mt-1 font-medium">
								{t(`admin.orders.status.${order.status}`, { defaultValue: order.status })}
							</p>
						</div>
						<div>
							<p className="text-muted-foreground">{t("admin.customers.orderDetails.date")}</p>
							<p className="mt-1 font-medium">{new Date(order.createdAt).toLocaleString("pt-BR")}</p>
						</div>
						<div>
							<p className="text-muted-foreground">{t("admin.customers.orderDetails.deliveryMethod")}</p>
							<p className="mt-1 font-medium">
								{t(`store.checkout.order.${order.deliveryMethod}`, { defaultValue: order.deliveryMethod })}
							</p>
						</div>
						{showOrderOperations && (
							<>
								<div>
									<p className="text-muted-foreground">{t("admin.orders.assignment.deadline")}</p>
									{onEditEstimate ? (
										<Button
											aria-label="Editar previsão"
											className="mt-1 h-10 w-full justify-between px-3 font-medium"
											onClick={onEditEstimate}
											type="button"
											variant="outline"
										>
											<span>{deadline}</span>
											<span className="flex items-center gap-1.5 border-border border-l pl-2 text-muted-foreground text-xs">
												Editar
												<LuPencil className="size-3.5" />
											</span>
										</Button>
									) : (
										<p className="mt-1 font-medium">{deadline}</p>
									)}
								</div>
								<div>
									<p className="text-muted-foreground">{t("admin.orders.assignment.preparedBy")}</p>
									<p className="mt-1 font-medium">{order.preparedBy?.name ?? "-"}</p>
								</div>
								<div>
									<p className="text-muted-foreground">{t("admin.orders.assignment.courier")}</p>
									<p className="mt-1 font-medium">{order.delivery?.courierName ?? "-"}</p>
								</div>
								{order.problemReason && (
									<div className="rounded-md border border-destructive/30 bg-destructive/5 p-3 sm:col-span-2">
										<p className="flex items-center gap-1.5 font-semibold text-destructive">
											<LuCircleAlert aria-hidden className="size-4 shrink-0" />
											{t("admin.orders.problemReason")}
										</p>
										<p className="mt-1 break-words font-medium text-foreground leading-5">{order.problemReason}</p>
									</div>
								)}
							</>
						)}
					</div>

					<section>
						<h3 className="font-semibold">{t("admin.customers.orderDetails.items")}</h3>
						<ul className="mt-3 divide-y divide-border/70">
							{order.items.map(item => (
								<li className="min-w-0 py-4 first:pt-0 last:pb-0" key={item.id}>
									<div className="grid min-w-0 grid-cols-[5rem_minmax(0,1fr)] gap-x-3">
										{item.imageUrl ? (
											<img
												alt={item.productName}
												className="size-20 rounded-lg object-cover"
												src={item.imageUrl}
											/>
										) : (
											<div aria-hidden className="size-20 rounded-lg bg-muted" />
										)}
										<div className="min-w-0">
											<div className="flex min-w-0 items-start justify-between gap-3">
												<p className="break-words font-semibold text-sm leading-5">
													{Number(item.quantity)}× {item.productName}
												</p>
												{showCustomerFinancials && (
													<span className="shrink-0 whitespace-nowrap font-semibold text-sm">
														{formatMoney(Number(item.total) / 100)}
													</span>
												)}
											</div>
											{item.options.length > 0 && (
												<ul className="mt-2 space-y-1 text-muted-foreground text-xs leading-4">
													{item.options.map(option => (
														<li className="flex min-w-0 justify-between gap-3" key={option.id}>
															<span className="min-w-0 break-words">
																{option.groupName}:{" "}
																{Number(option.quantity) > 1 ? `${Number(option.quantity)}× ` : ""}
																{option.optionName}
															</span>
															{showCustomerFinancials && (
																<span className="shrink-0 whitespace-nowrap">
																	{Number(option.priceDeltaCents) > 0
																		? `+${formatMoney((Number(option.priceDeltaCents) * Number(option.quantity)) / 100)}`
																		: formatMoney(0)}
																</span>
															)}
														</li>
													))}
												</ul>
											)}
										</div>
									</div>
									{item.note && (
										<p className="mt-3 break-words rounded-md border border-input bg-surface px-3 py-2 text-sm leading-5">
											{item.note}
										</p>
									)}
								</li>
							))}
						</ul>
					</section>

					{showCustomerFinancials ? (
						<section className="space-y-2 border-border border-t pt-4 text-sm">
							<div className="flex justify-between">
								<span className="text-muted-foreground">{t("store.checkout.order.itemsSubtotal")}</span>
								<span>{formatMoney(subtotal / 100)}</span>
							</div>
							{order.deliveryMethod === "delivery" && (
								<div className="flex justify-between">
									<span className="text-muted-foreground">{t("store.cart.deliveryFee")}</span>
									<span>{formatMoney(deliveryFee / 100)}</span>
								</div>
							)}
							{discount > 0 && (
								<div className="flex justify-between text-success">
									<span>
										{couponDetail
											? `${t("store.checkout.order.discount")} (${couponDetail})`
											: t("store.checkout.order.discount")}
									</span>
									<span>−{formatMoney(discount / 100)}</span>
								</div>
							)}
							{cashbackRedeemed > 0 && (
								<div className="flex justify-between text-success">
									<span>{t("store.checkout.order.cashbackRedeemed")}</span>
									<span>−{formatMoney(cashbackRedeemed / 100)}</span>
								</div>
							)}
							{loyaltyRedeemed > 0 && (
								<div className="flex justify-between text-success">
									<span>{t("store.checkout.order.loyaltyRedeemed")}</span>
									<span>−{formatMoney(loyaltyRedeemed / 100)}</span>
								</div>
							)}
							<div className="flex justify-between border-border border-t pt-3 font-bold text-base">
								<span>{t("admin.customers.orderDetails.total")}</span>
								<span>{formatMoney(Number(order.total) / 100)}</span>
							</div>
						</section>
					) : (
						<div className="flex justify-between border-border border-t pt-4 font-semibold">
							<span>{t("admin.customers.orderDetails.total")}</span>
							<span>{formatMoney(Number(order.total) / 100)}</span>
						</div>
					)}
				</div>
			)}
		</Modal>
	);
}
