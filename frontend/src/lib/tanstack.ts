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
