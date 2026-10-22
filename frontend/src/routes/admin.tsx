import { createFileRoute, Outlet, useRouterState } from "@tanstack/react-router";
import { useState } from "react";
import { LuMenu, LuX } from "react-icons/lu";
import { ScrollArea } from "@/components/ui/ScrollArea";
import { isOperationalStaff, requireStaffBeforeLoad } from "@/lib/staff-guard";
import { useAuthStore } from "@/stores";
import { AdminBrand, AdminSidebar, OperationalNavbar } from "./admin/components";

function AdminLayout() {
	const [mobileOpen, setMobileOpen] = useState(false);
	const isOrdersPage = useRouterState({
		select: state => /^\/admin\/orders\/?$/.test(state.location.pathname),
	});
	const role = useAuthStore(state => state.role);

	if (isOperationalStaff(role)) {
		return (
			<div className="admin-shell flex h-dvh flex-col overflow-hidden">
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
		<div
			className={
				isOrdersPage
					? "admin-shell flex h-dvh overflow-hidden"
					: "admin-shell flex min-h-screen overflow-x-hidden"
			}
		>
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
				inert={!mobileOpen}
			>
				<div className="flex items-center justify-end px-4 pt-4">
					<button
						aria-label="Fechar menu"
						className="grid size-9 shrink-0 cursor-pointer place-items-center rounded-xl border border-border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
						onClick={() => setMobileOpen(false)}
						type="button"
					>
						<LuX className="size-5" />
					</button>
				</div>
				<AdminSidebar onNavigate={() => setMobileOpen(false)} />
			</aside>

			<div className="flex min-h-0 min-w-0 flex-1 flex-col md:pl-60">
				<header className="admin-mobile-header sticky top-0 z-20 flex shrink-0 items-center justify-between gap-3 bg-primary px-5 py-4 text-primary-foreground md:hidden">
					<button
						aria-label="Abrir menu"
						className="grid size-10 shrink-0 cursor-pointer place-items-center rounded-xl border border-primary-foreground/40 text-primary-foreground transition-colors hover:bg-primary-foreground/10"
						onClick={() => setMobileOpen(true)}
						type="button"
					>
						<LuMenu className="size-5" />
					</button>
					<AdminBrand />
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
