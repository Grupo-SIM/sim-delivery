import { Link, useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import type { IconType } from "react-icons";
import {
	LuArrowLeft,
	LuBuilding2,
	LuChartBar,
	LuClipboardList,
	LuFolderTree,
	LuLandmark,
	LuImages,
	LuLogOut,
	LuPackage,
	LuPackageOpen,
	LuPalette,
	LuStar,
	LuStore,
	LuTag,
	LuTicket,
	LuUsers,
} from "react-icons/lu";
import { cn } from "@/lib/utils";
import { isSuperAdmin, useAuthStore } from "@/stores/auth";

interface NavItemProps {
	exact?: boolean;
	icon: IconType;
	label: string;
	onNavigate?: () => void;
	to: string;
}

function NavItem({ exact = false, icon: Icon, label, onNavigate, to }: NavItemProps) {
	return (
		<Link
			activeOptions={{ exact }}
			activeProps={{ className: "bg-primary text-primary-foreground font-semibold" }}
			className={cn(
				"flex items-center gap-3 rounded-md px-3 py-2 text-muted-foreground text-sm transition-colors hover:bg-primary hover:text-primary-foreground",
			)}
			onClick={onNavigate}
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
			<p className="mb-1 px-3 font-semibold text-[11px] text-muted-foreground/60 uppercase tracking-wider">
				{label}
			</p>
			{children}
		</div>
	);
}

export function AdminSidebar({ onNavigate }: { onNavigate?: () => void }) {
	const { t } = useTranslation();
	const { logout, role } = useAuthStore();
	const navigate = useNavigate();

	async function handleLogout() {
		await logout();
		void navigate({ to: "/identify" });
	}

	return (
		<div className="flex h-full flex-col gap-6 overflow-y-auto p-4">
			<div className="px-1">
				<span className="font-bold text-foreground text-lg">Admin</span>
			</div>

			<NavItem exact icon={LuChartBar} label="Dashboard" onNavigate={onNavigate} to="/admin/" />

			<NavGroup label={t("admin.dashboard.nav.products")}>
				<NavItem
					icon={LuPackage}
					label={t("admin.products.title")}
					onNavigate={onNavigate}
					to="/admin/products"
				/>
				<NavItem
					icon={LuFolderTree}
					label={t("admin.categories.title")}
					onNavigate={onNavigate}
					to="/admin/categories"
				/>
				<NavItem icon={LuTag} label={t("admin.tags.title")} onNavigate={onNavigate} to="/admin/tags" />
			</NavGroup>

			<NavGroup label={t("admin.dashboard.nav.operations")}>
				<NavItem
					icon={LuClipboardList}
					label={t("admin.orders.title")}
					onNavigate={onNavigate}
					to="/admin/orders"
				/>
				<NavItem
					icon={LuPackageOpen}
					label={t("admin.inventory.title")}
					onNavigate={onNavigate}
					to="/admin/inventory"
				/>
				<NavItem
					icon={LuTicket}
					label={t("admin.coupons.title")}
					onNavigate={onNavigate}
					to="/admin/coupons"
				/>
				<NavItem
					icon={LuImages}
					label={t("admin.promotionalImages.title")}
					onNavigate={onNavigate}
					to="/admin/promotional-images"
				/>
				<NavItem
					icon={LuUsers}
					label={t("admin.customers.title")}
					onNavigate={onNavigate}
					to="/admin/customers"
				/>
				<NavItem icon={LuStar} label={t("admin.reviews.title")} onNavigate={onNavigate} to="/admin/reviews" />
			</NavGroup>

			<NavGroup label={t("admin.dashboard.nav.settings")}>
				<NavItem
					icon={LuPalette}
					label={t("admin.branding.title")}
					onNavigate={onNavigate}
					to="/admin/branding"
				/>
				<NavItem icon={LuStore} label={t("admin.units.title")} onNavigate={onNavigate} to="/admin/units" />
				<NavItem icon={LuUsers} label={t("admin.staff.title")} onNavigate={onNavigate} to="/admin/staff" />
			</NavGroup>

			{isSuperAdmin(role) && (
				<NavGroup label={t("admin.dashboard.nav.platform")}>
					<NavItem
						icon={LuBuilding2}
						label={t("admin.companies.title")}
						onNavigate={onNavigate}
						to="/admin/companies"
					/>
				</NavGroup>
			)}

			<Link
				className="mt-auto flex items-center gap-3 rounded-md px-3 py-2 text-muted-foreground text-sm transition-colors hover:bg-primary hover:text-primary-foreground"
				onClick={onNavigate}
				to="/"
			>
				<LuArrowLeft className="size-4 shrink-0" />
				{t("admin.dashboard.nav.backToCustomerArea")}
			</Link>

			<button
				className="flex items-center gap-3 rounded-md px-3 py-2 text-left text-muted-foreground text-sm transition-colors hover:bg-primary hover:text-primary-foreground"
				onClick={() => void handleLogout()}
				type="button"
			>
				<LuLogOut className="size-4 shrink-0" />
				{t("admin.dashboard.nav.logout")}
			</button>
		</div>
	);
}
