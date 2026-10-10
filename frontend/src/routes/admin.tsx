import { createFileRoute, Outlet, useRouterState } from "@tanstack/react-router";
import { useState } from "react";
import { LuMenu, LuX } from "react-icons/lu";
import { ScrollArea } from "@/components/ui/ScrollArea";
import { isOperationalStaff, requireStaffBeforeLoad } from "@/lib/staff-guard";
import { useAuthStore } from "@/stores";
import { AdminSidebar, OperationalNavbar } from "./admin/components";

function AdminLayout() {
	const [mobileOpen, setMobileOpen] = useState(false);
	const isOrdersPage = useRouterState({
		select: state => /^\/admin\/orders\/?$/.test(state.location.pathname),
	});
	const role = useAuthStore(state => state.role);

	if (isOperationalStaff(role)) {
		return (
			<div className="flex h-dvh flex-col overflow-hidden">
				<OperationalNavbar />
				<main className="min-h-0 flex-1">
					<ScrollArea className={isOrdersPage ? "h-full overflow-hidden" : "h-full overflow-y-auto"}>
						<Outlet />
					</ScrollArea>
				</main>
			</div>
		);
	}

	return (
		<div className={isOrdersPage ? "flex h-dvh overflow-hidden" : "flex min-h-screen overflow-x-hidden"}>
			<aside className="fixed inset-y-0 left-0 z-20 hidden w-60 flex-col border-border border-r bg-card md:flex">
				<AdminSidebar />
			</aside>

			{mobileOpen && (
				<div
					aria-hidden="true"
					className="fixed inset-0 z-30 bg-black/50 md:hidden"
					onClick={() => setMobileOpen(false)}
				/>
			)}

			<aside
				aria-hidden={!mobileOpen}
				className={`fixed inset-y-0 left-0 z-40 w-60 flex-col border-border border-r bg-card transition-transform duration-300 md:hidden ${
					mobileOpen ? "flex translate-x-0" : "flex -translate-x-full"
				}`}
			>
				<div className="flex items-center justify-end px-4 pt-4">
					<button
						aria-label="Fechar menu"
						className="cursor-pointer rounded-md border border-transparent p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
						onClick={() => setMobileOpen(false)}
						type="button"
					>
						<LuX className="size-5" />
					</button>
				</div>
				<AdminSidebar onNavigate={() => setMobileOpen(false)} />
			</aside>

			<div className="flex min-h-0 min-w-0 flex-1 flex-col md:pl-60">
				<header className="sticky top-0 z-20 flex shrink-0 items-center gap-3 border-border border-b bg-card px-4 py-3 md:hidden">
					<button
						aria-label="Abrir menu"
						className="cursor-pointer rounded-md border border-transparent p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
						onClick={() => setMobileOpen(true)}
						type="button"
					>
						<LuMenu className="size-5" />
					</button>
					<span className="font-semibold text-sm">Admin</span>
				</header>

				<main className="min-h-0 min-w-0 flex-1">
					<Outlet />
				</main>
			</div>
		</div>
	);
}

export const Route = createFileRoute("/admin")({
	beforeLoad: ({ location }) => requireStaffBeforeLoad(location.pathname),
	component: AdminLayout,
});
