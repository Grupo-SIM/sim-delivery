import { useState } from "react";
import { useTranslation } from "react-i18next";
import { LuPrinter } from "react-icons/lu";
import { Button } from "@/components/ui/button";
import { Tooltip } from "@/components/ui/Tooltip";
import { getOrdersByOrderIdReceipt } from "@/lib/api";
import { showAlert } from "@/stores";
import { prepareReceiptTarget, printReceiptPdf } from "../-open-pdf-blob";
import { getOrderReceiptLabels } from "../-receipt-labels";

interface OrderReceiptButtonProps {
	orderId: string;
}

export function OrderReceiptButton({ orderId }: OrderReceiptButtonProps) {
	const { t } = useTranslation();
	const [isPreparing, setIsPreparing] = useState(false);

	async function handlePrint() {
		const pdfWindow = prepareReceiptTarget();
		setIsPreparing(true);
		try {
			const [receipt, { createOrderReceiptPdf }] = await Promise.all([
				getOrdersByOrderIdReceipt(orderId),
				import("../-order-receipt-pdf"),
			]);
			const pdf = createOrderReceiptPdf(
				receipt,
				getOrderReceiptLabels(t, receipt.payment?.method, receipt.payment?.status, receipt.status),
			);
			await printReceiptPdf(pdf.output("blob"), pdfWindow, `pedido-${orderId}.pdf`);
		} catch {
			pdfWindow?.close();
			void showAlert(t("admin.orders.receipt.error"), t("admin.orders.receipt.errorTitle"));
		} finally {
			setIsPreparing(false);
		}
	}

	const label = isPreparing ? t("admin.orders.receipt.preparing") : t("admin.orders.receipt.action");

	return (
		<Tooltip content={label}>
			<Button aria-label={label} disabled={isPreparing} onClick={() => void handlePrint()} size="icon" type="button" variant="outline">
				<LuPrinter aria-hidden className="size-4" />
			</Button>
		</Tooltip>
	);
}
