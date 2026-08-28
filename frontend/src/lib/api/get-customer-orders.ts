import { useQuery } from "@tanstack/react-query";
import fetch from "./client-api";

export interface CustomerOrderSummary {
	createdAt: string;
	deliveryMethod: "delivery" | "pickup";
	displayNumber: number;
	id: string;
	itemsCount: number;
	status: string;
	total: number;
	unitName: string;
	unitSlug: string;
}

function getCustomerOrdersQueryKey(slug: string) {
	return ["customer-orders", slug] as const;
}

async function getCustomerOrders(slug: string): Promise<CustomerOrderSummary[]> {
	const response = await fetch<CustomerOrderSummary[]>({
		method: "GET",
		params: { slug },
		url: "/orders/mine",
	});
	return response.data;
}

export function useGetCustomerOrders(slug: string, enabled = true) {
	return useQuery({
		enabled: enabled && !!slug,
		queryFn: () => getCustomerOrders(slug),
		queryKey: getCustomerOrdersQueryKey(slug),
		refetchInterval: 15_000,
	});
}
