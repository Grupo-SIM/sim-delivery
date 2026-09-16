import type { TFunction } from "i18next";
import type { OrderReceiptLabels } from "./-order-receipt-pdf";

export function getOrderReceiptLabels(
	t: TFunction,
	paymentMethod: string | undefined,
	paymentStatus: string | undefined,
	status: string,
): OrderReceiptLabels {
	return {
		address: t("admin.orders.receipt.address"),
		addressMissing: t("admin.orders.receipt.addressMissing"),
		amountDue: t("admin.orders.receipt.amountDue"),
		cashback: t("admin.orders.receipt.cashback"),
		customer: t("admin.orders.receipt.customer"),
		customerCpf: t("admin.orders.receipt.customerCpf"),
		date: t("admin.orders.receipt.date"),
		delivery: t("admin.orders.receipt.delivery"),
		deliveryFee: t("admin.orders.receipt.deliveryFee"),
		discount: t("admin.orders.receipt.discount"),
		estimatedDelivery: t("admin.orders.receipt.estimatedDelivery"),
		firstOrder: t("admin.orders.receipt.firstOrder"),
		loyalty: t("admin.orders.receipt.loyalty"),
		note: t("admin.orders.receipt.note"),
		order: t("admin.orders.receipt.order"),
		payment: t("admin.orders.receipt.payment"),
		paymentAmount: t("admin.orders.receipt.paymentAmount"),
		paymentMethod: paymentMethod
			? t(`admin.orders.receipt.paymentMethod.${paymentMethod}`, { defaultValue: paymentMethod })
			: "",
		paymentMissing: t("admin.orders.receipt.paymentMissing"),
		paymentStatus: paymentStatus
			? t(`admin.orders.receipt.paymentStatus.${paymentStatus}`, { defaultValue: paymentStatus })
			: "",
		pickup: t("admin.orders.receipt.pickup"),
		preparedBy: t("admin.orders.receipt.preparedBy"),
		status: t(`admin.orders.status.${status}`, { defaultValue: status }),
		statusLabel: t("admin.orders.receipt.status"),
		subtotal: t("admin.orders.receipt.subtotal"),
		total: t("admin.orders.receipt.total"),
	};
}
