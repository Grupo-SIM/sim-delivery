import { useState } from "react";
import { useTranslation } from "react-i18next";
import { LuPrinter } from "react-icons/lu";
import { Button } from "@/components/ui/button";
import { getOrdersByOrderIdReceipt } from "@/lib/api";
import { showAlert } from "@/stores";
import type { OrderReceiptLabels } from "../-order-receipt-pdf";
import { printPdfBlob } from "../-print-pdf-blob";

interface OrderReceiptButtonProps {
	orderId: string;
}

export function OrderReceiptButton({ orderId }: OrderReceiptButtonProps) {
	const { t } = useTranslation();
	const [isPreparing, setIsPreparing] = useState(false);

	function getLabels(paymentMethod: string | undefined, paymentStatus: string | undefined, status: string) {
		return {
			address: t("admin.orders.receipt.address"),
			addressMissing: t("admin.orders.receipt.addressMissing"),
			cashback: t("admin.orders.receipt.cashback"),
			customer: t("admin.orders.receipt.customer"),
			date: t("admin.orders.receipt.date"),
			delivery: t("admin.orders.receipt.delivery"),
			deliveryFee: t("admin.orders.receipt.deliveryFee"),
			discount: t("admin.orders.receipt.discount"),
			loyalty: t("admin.orders.receipt.loyalty"),
			note: t("admin.orders.receipt.note"),
			order: t("admin.orders.receipt.order"),
			payment: t("admin.orders.receipt.payment"),
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
		} satisfies OrderReceiptLabels;
	}

	async function handlePrint() {
		setIsPreparing(true);
		try {
			const [receipt, { createOrderReceiptPdf }] = await Promise.all([
				getOrdersByOrderIdReceipt(orderId),
				import("../-order-receipt-pdf"),
			]);
			const pdf = createOrderReceiptPdf(
				receipt,
				getLabels(receipt.payment?.method, receipt.payment?.status, receipt.status),
			);
			await printPdfBlob(pdf.output("blob"));
		} catch {
			void showAlert(t("admin.orders.receipt.error"), t("admin.orders.receipt.errorTitle"));
		} finally {
			setIsPreparing(false);
		}
	}

	return (
		<Button disabled={isPreparing} onClick={() => void handlePrint()} size="sm" type="button" variant="outline">
			<LuPrinter aria-hidden className="size-4" />
			{isPreparing ? t("admin.orders.receipt.preparing") : t("admin.orders.receipt.action")}
		</Button>
	);
}
