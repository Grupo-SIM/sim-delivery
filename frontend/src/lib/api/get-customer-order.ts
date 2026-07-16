import { useQuery } from "@tanstack/react-query";
import fetch from "./client-api";

export interface CustomerOrderTracking {
	cancelReason: string | null;
	createdAt: string;
	deliveryMethod: "delivery" | "pickup";
	id: string;
	items: {
		id: string;
		note: string | null;
		productName: string;
		quantity: number;
	}[];
	status: string;
	statusEvents: {
		createdAt: string;
		id: string;
		status: string;
	}[];
	total: number;
	unitName: string;
}

function getCustomerOrderQueryKey(orderId: string, slug: string) {
	return ["customer-order", orderId, slug] as const;
}

async function getCustomerOrder(orderId: string, slug: string): Promise<CustomerOrderTracking> {
	const response = await fetch<CustomerOrderTracking>({
		method: "GET",
		params: { slug },
		url: `/orders/${orderId}/track`,
	});
	return response.data;
}

export function useGetCustomerOrder(orderId: string, slug: string) {
	return useQuery({
		enabled: !!orderId && !!slug,
		queryFn: () => getCustomerOrder(orderId, slug),
		queryKey: getCustomerOrderQueryKey(orderId, slug),
		refetchInterval: 5_000,
	});
}
