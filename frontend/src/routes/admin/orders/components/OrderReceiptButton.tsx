import { useState } from "react";
import { useTranslation } from "react-i18next";
import { LuPrinter } from "react-icons/lu";
import { Button } from "@/components/ui/button";
import { Tooltip } from "@/components/ui/Tooltip";
import { canPrintNatively, openPdfNatively, printPdfNatively } from "@/lib/native-printer";
import { showAlert, useAutoPrintStore } from "@/stores";
import { prepareReceiptTarget, printReceiptPdf } from "../-open-pdf-blob";
import { createOrderReceiptBlob } from "../-create-receipt-blob";

interface OrderReceiptButtonProps {
	orderId: string;
}

export function OrderReceiptButton({ orderId }: OrderReceiptButtonProps) {
	const { t } = useTranslation();
	const [isPreparing, setIsPreparing] = useState(false);
	const { enabled: autoPrintEnabled, printer } = useAutoPrintStore();

	async function handlePrint() {
		// Auto-print on (desktop app): same silent path as new orders, no dialog.
		const native = canPrintNatively();
		const silent = native && autoPrintEnabled && printer !== "";
		const pdfWindow = native ? null : prepareReceiptTarget();
		setIsPreparing(true);
		try {
			const blob = await createOrderReceiptBlob(orderId, t);
			if (silent) await printPdfNatively(printer, blob);
			else if (native) await openPdfNatively(blob, `pedido-${orderId}.pdf`);
			else await printReceiptPdf(blob, pdfWindow, `pedido-${orderId}.pdf`);
		} catch (error) {
			console.error("Receipt print failed", error);
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
