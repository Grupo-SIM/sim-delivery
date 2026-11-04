import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { canPrintNatively, printPdfNatively } from "@/lib/native-printer";
import { useGetOrders } from "@/lib/api";
import { showToast, useAutoPrintStore } from "@/stores";
import { createOrderReceiptBlob } from "./-create-receipt-blob";

/** Order status that marks a newly received (confirmed) order. */
const RECEIVED_STATUS = "recebido";

/**
 * Silently prints the receipt of every order that reaches "recebido" while auto-print is on.
 * Fetches its own unfiltered list so board search/date filters never hide a new order.
 */
export function useAutoPrintOrders(unitId: string) {
	const { t } = useTranslation();
	const { enabled, markPrinted, printedIds, printer } = useAutoPrintStore();
	const ordersQuery = useGetOrders(unitId ? { unitId } : {}, { query: { enabled: enabled && canPrintNatively() } });
	const inFlightRef = useRef(new Set<string>());
	const wasEnabledRef = useRef(enabled);

	const received = ordersQuery.data?.filter(order => order.status === RECEIVED_STATUS) ?? [];

	useEffect(() => {
		if (!enabled || !printer || !ordersQuery.data) return;

		// Turning auto-print on must not dump the existing backlog on the printer.
		if (!wasEnabledRef.current) {
			wasEnabledRef.current = true;
			markPrinted(received.map(order => order.id));
			return;
		}

		const pending = received.filter(order => !printedIds.includes(order.id) && !inFlightRef.current.has(order.id));
		for (const order of pending) {
			inFlightRef.current.add(order.id);
			void (async () => {
				try {
					await printPdfNatively(printer, await createOrderReceiptBlob(order.id, t));
					markPrinted([order.id]);
				} catch (error) {
					console.error("Auto print failed", error);
					showToast(t("admin.orders.autoPrint.error"), "negative");
				} finally {
					inFlightRef.current.delete(order.id);
				}
			})();
		}
	}, [enabled, markPrinted, ordersQuery.data, printedIds, printer, received, t]);

	useEffect(() => {
		if (!enabled) wasEnabledRef.current = false;
	}, [enabled]);
}
