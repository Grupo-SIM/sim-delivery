import { useEffect, useRef, useState } from "react";
import { branding } from "@/lib/branding";

interface PaymentStatusEvent {
	status: string;
}

function parsePaymentStatusEvent(data: string): PaymentStatusEvent | null {
	try {
		const value: unknown = JSON.parse(data);
		if (
			typeof value === "object" &&
			value !== null &&
			"status" in value &&
			typeof value.status === "string"
		) {
			return { status: value.status };
		}
	} catch {
		// Ignore malformed events. The status-query fallback remains active.
	}

	return null;
}

export function usePaymentStatusEvents(token: string | undefined, onStatus: (status: string) => void) {
	const [isConnected, setIsConnected] = useState(false);
	const onStatusRef = useRef(onStatus);

	useEffect(() => {
		onStatusRef.current = onStatus;
	}, [onStatus]);

	useEffect(() => {
		if (!token) {
			setIsConnected(false);
			return;
		}

		const source = new EventSource(
			`${branding.apiUrl.replace(/\/$/, "")}/payments/status/${encodeURIComponent(token)}/events`,
			{ withCredentials: true },
		);

		source.onopen = () => setIsConnected(true);
		source.onerror = () => setIsConnected(false);
		source.addEventListener("payment-status", event => {
			const paymentEvent = parsePaymentStatusEvent(event.data);
			if (paymentEvent) onStatusRef.current(paymentEvent.status);
		});

		return () => {
			source.close();
			setIsConnected(false);
		};
	}, [token]);

	return isConnected;
}
