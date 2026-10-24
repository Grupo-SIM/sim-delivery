import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_storefront/$unitId/cardapio/")({
	beforeLoad: ({ params }) => {
		throw redirect({
			params: { unitId: params.unitId },
			replace: true,
			search: { menuOnly: true, taxes: false },
			to: "/$unitId",
		});
	},
});
