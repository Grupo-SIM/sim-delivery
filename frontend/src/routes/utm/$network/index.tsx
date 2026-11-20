import { createFileRoute } from "@tanstack/react-router";
import { redirectToTrackedHome } from "@/lib/utm-redirect";


export const Route = createFileRoute("/utm/$network/")({
	beforeLoad: ({ params, search }) => redirectToTrackedHome(params.network, search),
});
