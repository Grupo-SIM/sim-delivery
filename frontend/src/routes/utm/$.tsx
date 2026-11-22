import { createFileRoute } from "@tanstack/react-router";
import { redirectToTrackedLink } from "@/lib/utm-redirect";

/** `/utm/instagram`, `/utm/influencers/fulano`...: tracked short links of any depth, managed in admin/platform/marketing. */
export const Route = createFileRoute("/utm/$")({
	beforeLoad: ({ params, search }) => redirectToTrackedLink(params._splat ?? "", search),
});
