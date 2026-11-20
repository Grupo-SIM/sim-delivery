import { createFileRoute } from "@tanstack/react-router";
import { redirectToTrackedHome } from "@/lib/utm-redirect";
import { BIO_NETWORK } from "@/lib/utm-networks";

/** Short Instagram bio link. nginx redirects it server-side; this keeps dev and Tauri working. */
export const Route = createFileRoute("/cardapio/")({
	beforeLoad: ({ search }) => redirectToTrackedHome(BIO_NETWORK, search),
});
