import { createFileRoute } from "@tanstack/react-router";
import { redirectToTrackedHome } from "@/lib/utm-redirect";

/** `/utm/instagram`: tracked short link to the home (the unit picker, when the company has several units). */
export const Route = createFileRoute("/utm/$network/")({
	beforeLoad: ({ params, search }) => redirectToTrackedHome(params.network, search),
});
