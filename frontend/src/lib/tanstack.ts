import { tanstackClient } from "@hyoretsu/kubb/client";

export const reactQueryClient = tanstackClient();

// Branding changes only through the management form. Keep its response until that mutation invalidates it.
reactQueryClient.setQueryDefaults(["/branding/"], {
	gcTime: Number.POSITIVE_INFINITY,
	refetchOnMount: false,
	refetchOnReconnect: false,
	refetchOnWindowFocus: false,
	staleTime: Number.POSITIVE_INFINITY,
});

for (const queryKey of [
	["Customers", "/customers/me"],
	["Cashback", "/cashback/me"],
	["Loyalty", "/loyalty/me"],
]) {
	reactQueryClient.setQueryDefaults(queryKey, {
		refetchOnMount: false,
		refetchOnReconnect: false,
		refetchOnWindowFocus: false,
		staleTime: 60_000,
	});
}
