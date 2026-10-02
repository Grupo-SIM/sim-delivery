import type { QueryClient } from "@tanstack/react-query";
import { getPaymentsStatusByTokenQueryKey, type PostPaymentsCard200 } from "@/lib/api";

export async function syncCardPaymentStatus(queryClient: QueryClient, payment: PostPaymentsCard200) {
	const queryKey = getPaymentsStatusByTokenQueryKey(payment.token);
	// Retries reuse the payment token. Discard both cached terminal statuses and
	// in-flight responses from the previous charge before mounting its observer.
	await queryClient.cancelQueries({ exact: true, queryKey });
	queryClient.setQueryData(queryKey, { status: payment.status });
}
