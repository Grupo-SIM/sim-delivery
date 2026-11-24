import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useGetOrders } from "@/lib/api";
import { canPrintNatively, printPdfNatively } from "@/lib/native-printer";
import { showToast, useAutoPrintStore } from "@/stores";
import { createOrderReceiptBlob } from "./-create-receipt-blob";
import { useOrderEvents } from "./use-order-events";

/** Order status that marks a confirmed (paid) order. */
const RECEIVED_STATUS = "recebido";
/** Safety net for events lost between server replicas; payment webhooks normally push through SSE. */
const SAFETY_REFETCH_MS = 30_000;

/**
 * Silently prints the receipt of every order that reaches "recebido" while auto-print is on.
 * Mounted in the admin layout so it keeps working on any screen: the payment webhook confirms the
 * order, the order SSE stream signals it, and this hook refetches and prints it.
 * Fetches its own unfiltered list so board search/date filters never hide a new order.
 */
export function useAutoPrintOrders() {
	const { t } = useTranslation();
	const { enabled, markPrinted, printedIds, printer, unitId } = useAutoPrintStore();
	const active = enabled && canPrintNatively();
	useOrderEvents(unitId, active);
	const ordersQuery = useGetOrders(unitId ? { unitId } : {}, {
		query: { enabled: active, refetchInterval: SAFETY_REFETCH_MS },
	});
	const inFlightRef = useRef(new Set<string>());
	// Unit whose backlog was already baselined. Starts set when auto-print was left on, so orders
	// confirmed while the app was closed still print on launch.
	const baselineUnitRef = useRef<string | null>(enabled ? unitId : null);

	const received = ordersQuery.data?.filter(order => order.status === RECEIVED_STATUS) ?? [];

	useEffect(() => {
		if (!active) baselineUnitRef.current = null;
	}, [active]);

	useEffect(() => {
		if (!active || !printer || !ordersQuery.data) return;

		// Turning auto-print on (or switching unit) must not dump the existing backlog on the printer.
		if (baselineUnitRef.current !== unitId) {
			baselineUnitRef.current = unitId;
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
	}, [active, markPrinted, ordersQuery.data, printedIds, printer, received, t, unitId]);
}
