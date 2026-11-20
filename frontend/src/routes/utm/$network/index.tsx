import { createFileRoute } from "@tanstack/react-router";
import { redirectToTrackedHome } from "@/lib/utm-redirect";

/** `/utm/instagram`, `/utm/tiktok`...: tracked short links, see `utm-networks.ts`. */
export const Route = createFileRoute("/utm/$network/")({
	beforeLoad: ({ params, search }) => redirectToTrackedHome(params.network, search),
});
