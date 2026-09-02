import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { getOrdersQueryKey } from "@/lib/api";
import { branding } from "@/lib/branding";

/** Keeps every open order board synchronized with persisted order changes. */
export function useOrderEvents(unitId: string) {
	const queryClient = useQueryClient();
	const invalidateTimerRef = useRef<number | null>(null);

	useEffect(() => {
		const params = new URLSearchParams();
		if (unitId) params.set("unitId", unitId);
		const query = params.size ? `?${params}` : "";
		const source = new EventSource(`${branding.apiUrl.replace(/\/$/, "")}/orders/events${query}`, {
			withCredentials: true,
		});

		const invalidate = () => {
			if (invalidateTimerRef.current !== null) return;
			invalidateTimerRef.current = window.setTimeout(() => {
				invalidateTimerRef.current = null;
				void queryClient.invalidateQueries({ queryKey: getOrdersQueryKey() });
			}, 100);
		};
		source.addEventListener("orders-changed", invalidate);

		return () => {
			source.close();
			if (invalidateTimerRef.current !== null) {
				window.clearTimeout(invalidateTimerRef.current);
				invalidateTimerRef.current = null;
			}
		};
	}, [queryClient, unitId]);
}
