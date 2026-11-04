import type { TFunction } from "i18next";
import { getOrdersByOrderIdReceipt } from "@/lib/api";
import { getOrderReceiptLabels } from "./-receipt-labels";

/** Fetches an order's receipt and renders it as a PDF blob. */
export async function createOrderReceiptBlob(orderId: string, t: TFunction): Promise<Blob> {
	const [receipt, { createOrderReceiptPdf }] = await Promise.all([
		getOrdersByOrderIdReceipt(orderId),
		import("./-order-receipt-pdf"),
	]);
	const pdf = createOrderReceiptPdf(
		receipt,
		getOrderReceiptLabels(t, receipt.payment?.method, receipt.payment?.status, receipt.status),
	);
	return pdf.output("blob");
}
