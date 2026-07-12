import { createFileRoute, Outlet } from "@tanstack/react-router";
import { useState } from "react";
import { LuMenu, LuX } from "react-icons/lu";
import { requireStaffBeforeLoad } from "@/lib/staff-guard";
import { AdminSidebar } from "./admin/components";

function AdminLayout() {
	const [mobileOpen, setMobileOpen] = useState(false);

	return (
		<div className="flex min-h-screen">
			{/* Desktop sidebar */}
			<aside className="fixed inset-y-0 left-0 z-20 hidden w-60 flex-col border-border border-r bg-card md:flex">
				<AdminSidebar />
			</aside>

			{/* Mobile overlay */}
			{mobileOpen && (
				<div className="fixed inset-0 z-30 bg-black/50 md:hidden" onClick={() => setMobileOpen(false)} />
			)}

			{/* Mobile sidebar drawer */}
			<aside
				className={`fixed inset-y-0 left-0 z-40 w-60 flex-col border-border border-r bg-card transition-transform duration-300 md:hidden ${
					mobileOpen ? "flex translate-x-0" : "flex -translate-x-full"
				}`}
			>
				<div className="flex items-center justify-end px-4 pt-4">
					<button
						className="rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
						onClick={() => setMobileOpen(false)}
						type="button"
					>
						<LuX className="size-5" />
					</button>
				</div>
				<AdminSidebar />
			</aside>

			{/* Content area */}
			<div className="flex flex-1 flex-col md:pl-60">
				{/* Mobile top bar */}
				<header className="sticky top-0 z-20 flex items-center gap-3 border-border border-b bg-card px-4 py-3 md:hidden">
					<button
						className="rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
						onClick={() => setMobileOpen(true)}
						type="button"
					>
						<LuMenu className="size-5" />
					</button>
					<span className="font-semibold text-sm">Admin</span>
				</header>

				<main className="flex-1">
					<Outlet />
				</main>
			</div>
		</div>
	);
}

export const Route = createFileRoute("/admin")({
	beforeLoad: requireStaffBeforeLoad,
	component: AdminLayout,
});
