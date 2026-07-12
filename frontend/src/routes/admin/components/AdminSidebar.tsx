import { Link, useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import {
	LuBuilding2,
	LuChartBar,
	LuClipboardList,
	LuLogOut,
	LuPackage,
	LuPalette,
	LuStar,
	LuStore,
	LuUsers,
	LuUtensilsCrossed,
} from "react-icons/lu";
import type { IconType } from "react-icons";
import { cn } from "@/lib/utils";
import { isSuperAdmin, useAuthStore } from "@/stores/auth";

interface NavItemProps {
	exact?: boolean;
	icon: IconType;
	label: string;
	to: string;
}

function NavItem({ exact = false, icon: Icon, label, to }: NavItemProps) {
	return (
		<Link
			activeOptions={{ exact }}
			activeProps={{ className: "bg-primary/10 text-primary font-semibold" }}
			className={cn(
				"flex items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground",
			)}
			to={to}
		>
			<Icon className="size-4 shrink-0" />
			{label}
		</Link>
	);
}

interface NavGroupProps {
	children: React.ReactNode;
	label: string;
}

function NavGroup({ children, label }: NavGroupProps) {
	return (
		<div className="space-y-1">
			<p className="mb-1 px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">
				{label}
			</p>
			{children}
		</div>
	);
}

export function AdminSidebar() {
	const { t } = useTranslation();
	const { logout, role } = useAuthStore();
	const navigate = useNavigate();

	async function handleLogout() {
		await logout();
		void navigate({ to: "/login" });
	}

	return (
		<div className="flex h-full flex-col gap-6 overflow-y-auto p-4">
			<div className="px-1">
				<span className="font-bold text-foreground text-lg">Admin</span>
			</div>

			<NavItem exact icon={LuChartBar} label="Dashboard" to="/admin/" />

			<NavGroup label={t("admin.dashboard.nav.catalog")}>
				<NavItem icon={LuPackage} label={t("admin.products.title")} to="/admin/products" />
				<NavItem icon={LuStore} label={t("admin.units.title")} to="/admin/units" />
			</NavGroup>

			<NavGroup label={t("admin.dashboard.nav.operations")}>
				<NavItem icon={LuClipboardList} label={t("admin.orders.title")} to="/admin/orders" />
				<NavItem icon={LuUtensilsCrossed} label={t("admin.kitchen.title")} to="/admin/kitchen" />
				<NavItem icon={LuStar} label={t("admin.reviews.title")} to="/admin/reviews" />
			</NavGroup>

			<NavGroup label={t("admin.dashboard.nav.settings")}>
				<NavItem icon={LuUsers} label={t("admin.staff.title")} to="/admin/staff" />
				<NavItem icon={LuPalette} label={t("admin.branding.title")} to="/admin/branding" />
			</NavGroup>

			{isSuperAdmin(role) && (
				<NavGroup label={t("admin.dashboard.nav.platform")}>
					<NavItem icon={LuBuilding2} label={t("admin.companies.title")} to="/admin/companies" />
				</NavGroup>
			)}

			<button
				className="mt-auto flex items-center gap-3 rounded-md px-3 py-2 text-left text-muted-foreground text-sm transition-colors hover:bg-accent hover:text-foreground"
				onClick={() => void handleLogout()}
				type="button"
			>
				<LuLogOut className="size-4 shrink-0" />
				{t("admin.dashboard.nav.logout")}
			</button>
		</div>
	);
}
