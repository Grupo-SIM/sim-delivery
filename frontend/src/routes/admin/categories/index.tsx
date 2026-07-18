import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/categories/")({
	beforeLoad: () => {
		throw redirect({ search: { tab: "categories" }, to: "/admin/products" });
	},
});
