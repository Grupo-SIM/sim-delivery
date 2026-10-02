import { expect, test } from "bun:test";
import { QueryClient } from "@tanstack/react-query";
import { getPaymentsStatusByTokenQueryKey, type GetPaymentsStatusByTokenQueryResponse } from "@/lib/api";
import { syncCardPaymentStatus } from "./sync-card-payment-status";

test("a pending card retry replaces a cached decline for the reused token", async () => {
	const client = new QueryClient();
	const queryKey = getPaymentsStatusByTokenQueryKey("reused-token");
	client.setQueryData(queryKey, { status: "failed" });
	await syncCardPaymentStatus(client, { status: "pending", token: "reused-token" });
	expect(client.getQueryData<GetPaymentsStatusByTokenQueryResponse>(queryKey)).toEqual({ status: "pending" });
	client.clear();
});

test("an old in-flight decline cannot overwrite the new pending charge", async () => {
	const client = new QueryClient();
	const queryKey = getPaymentsStatusByTokenQueryKey("reused-token");
	let resolve!: (value: { status: string }) => void;
	const oldRequest = client.fetchQuery({
		queryFn: () => new Promise<{ status: string }>(done => { resolve = done; }),
		queryKey,
	}).catch(() => undefined);
	await syncCardPaymentStatus(client, { status: "pending", token: "reused-token" });
	resolve({ status: "failed" });
	await oldRequest;
	expect(client.getQueryData<GetPaymentsStatusByTokenQueryResponse>(queryKey)).toEqual({ status: "pending" });
	client.clear();
});
