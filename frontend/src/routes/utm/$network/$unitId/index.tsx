import { createFileRoute } from "@tanstack/react-router";
import { redirectToTrackedHome } from "@/lib/utm-redirect";

/** `/utm/instagram/<unit-slug>`: tracked short link straight to one unit's menu. */
export const Route = createFileRoute("/utm/$network/$unitId/")({
	beforeLoad: ({ params, search }) => redirectToTrackedHome(params.network, search, params.unitId),
});
