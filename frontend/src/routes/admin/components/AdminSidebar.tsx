import { Link, useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import {
	LuArrowLeft,
	LuBuilding2,
	LuChartBar,
	LuClipboardList,
	LuFolderTree,
	LuLandmark,
	LuBadgeDollarSign,
	LuLogOut,
	LuPackage,
	LuPackageOpen,
	LuReceiptText,
	LuSettings,
	LuStar,
	LuStore,
	LuTag,
	LuPercent,
	LuTicket,
	LuUsers,
} from "react-icons/lu";
import { useGetPlatformFeesUnderCoveredCompanies } from "@/lib/api";
import { ScrollArea } from "@/components/ui/ScrollArea";
import { canCustomizeReceipt, isAttendant, isManager, requiresSelectedUnit } from "@/lib/staff-guard";
import { isSuperAdmin, useAuthStore } from "@/stores/auth";
import { AdminBrand } from "./AdminBrand";
import { AdminNavGroup } from "./AdminNavGroup";
import { AdminNavItem } from "./AdminNavItem";
import { AdminUnitPicker } from "./AdminUnitPicker";

export function AdminSidebar({ onNavigate }: { onNavigate?: () => void }) {
	const { t } = useTranslation();
	const { logout, role } = useAuthStore();
	const navigate = useNavigate();
	const attendant = isAttendant(role);
	const manager = isManager(role);
	const needsUnitSelection = requiresSelectedUnit(role);
	const { data: underCovered = [] } = useGetPlatformFeesUnderCoveredCompanies({ query: { enabled: isSuperAdmin(role) } });

	async function handleLogout() {
		await logout();
		void navigate({ search: { redirectTo: undefined }, to: "/identify" });
	}

	return (
		<ScrollArea className="flex h-full flex-col gap-6 overflow-y-auto p-4">
			<div className="admin-sidebar-brand -mx-4 -mt-4 flex shrink-0 items-center bg-primary px-5 py-4 text-primary-foreground">
				<AdminBrand />
			</div>
			{needsUnitSelection && <AdminUnitPicker />}

			{!attendant && <AdminNavItem exact icon={LuChartBar} label="Dashboard" onNavigate={onNavigate} to="/admin/" />}

			<AdminNavGroup label={t("admin.dashboard.nav.operations")}>
				<AdminNavItem
					icon={LuClipboardList}
					label={t("admin.orders.title")}
					onNavigate={onNavigate}
					to="/admin/orders"
				/>
				{!attendant && <AdminNavItem icon={LuLandmark} label="Financeiro" onNavigate={onNavigate} to="/admin/finance" />}
				{!attendant && (
					<>
						<AdminNavItem
							icon={LuTicket}
							label={t("admin.coupons.title")}
							onNavigate={onNavigate}
							to="/admin/coupons"
						/>
						<AdminNavItem
							icon={LuPercent}
							label={t("admin.discounts.title")}
							onNavigate={onNavigate}
							to="/admin/discounts"
						/>
						<AdminNavItem
							icon={LuUsers}
							label={t("admin.customers.title")}
							onNavigate={onNavigate}
							to="/admin/customers"
						/>
						<AdminNavItem icon={LuStar} label={t("admin.reviews.title")} onNavigate={onNavigate} to="/admin/reviews" />
					</>
				)}
			</AdminNavGroup>

			<AdminNavGroup label={t("admin.dashboard.nav.products")}>
				<AdminNavItem
					icon={LuPackage}
					label={t("admin.products.title")}
					onNavigate={onNavigate}
					to="/admin/products"
				/>
				<AdminNavItem
					icon={LuPackageOpen}
					label={t("admin.inventory.title")}
					onNavigate={onNavigate}
					to="/admin/inventory"
				/>
				<AdminNavItem
					icon={LuFolderTree}
					label={t("admin.categories.title")}
					onNavigate={onNavigate}
					to="/admin/categories"
				/>
				<AdminNavItem icon={LuTag} label={t("admin.tags.title")} onNavigate={onNavigate} to="/admin/tags" />
			</AdminNavGroup>

			{!attendant && (
				<AdminNavGroup label={t("admin.dashboard.nav.settings")}>
					{canCustomizeReceipt(role) && (
						<AdminNavItem
							icon={LuReceiptText}
							label={t("admin.receiptTemplate.navTitle")}
							onNavigate={onNavigate}
							to="/admin/receipt-template"
						/>
					)}
					<AdminNavItem
						icon={LuUsers}
						label={t("admin.staff.title")}
						onNavigate={onNavigate}
						to="/admin/staff"
					/>
					<AdminNavItem
						icon={LuSettings}
						label={t("admin.branding.navTitle")}
						onNavigate={onNavigate}
						to="/admin/company"
					/>
					{!manager && (
						<AdminNavItem icon={LuStore} label={t("admin.units.title")} onNavigate={onNavigate} to="/admin/units" />
					)}
				</AdminNavGroup>
			)}

			{isSuperAdmin(role) && (
				<AdminNavGroup label={t("admin.dashboard.nav.platform")}>
					<AdminNavItem icon={LuBadgeDollarSign} label="Taxas" onNavigate={onNavigate} to="/admin/platform/fees" />
					<AdminNavItem
						icon={LuBuilding2}
						label={t("admin.companies.title")}
						onNavigate={onNavigate}
						to="/admin/platform/companies"
						warning={underCovered.length > 0 ? t("admin.companies.underCovered") : undefined}
					/>
				</AdminNavGroup>
			)}

			<Link
				className="mt-auto flex items-center gap-3 cursor-pointer rounded-xl border border-border px-3 py-2.5 text-muted-foreground text-sm transition-colors hover:bg-muted hover:text-foreground"
				onClick={onNavigate}
				to="/"
			>
				<LuArrowLeft className="size-4 shrink-0" />
				{t("admin.dashboard.nav.backToCustomerArea")}
			</Link>

			<button
				className="flex items-center gap-3 cursor-pointer rounded-xl border border-border px-3 py-2.5 text-left text-muted-foreground text-sm transition-colors hover:bg-muted hover:text-foreground"
				onClick={() => void handleLogout()}
				type="button"
			>
				<LuLogOut className="size-4 shrink-0" />
				{t("admin.dashboard.nav.logout")}
			</button>
		</ScrollArea>
	);
}
