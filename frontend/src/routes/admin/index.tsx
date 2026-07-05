import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { LuBuilding2, LuChartBar, LuClipboardList, LuLayoutGrid, LuPackage, LuStar, LuStore, LuTag, LuUtensilsCrossed, LuUsers } from "react-icons/lu";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { requireStaffBeforeLoad } from "@/lib/staff-guard";
import { isSuperAdmin, useAuthStore } from "@/stores/auth";
import { AdminSectionCard } from "./components";

function AdminDashboardPage() {
	const { t } = useTranslation();
	const { role } = useAuthStore();

	return (
		<Container className="space-y-6 py-8">
			<SectionHeading subtitle={t("admin.dashboard.subtitle")} title={t("admin.dashboard.title")} />

			<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
				<AdminSectionCard
					description={t("admin.units.subtitle")}
					icon={LuStore}
					title={t("admin.units.title")}
					to="/admin/units"
				/>
				<AdminSectionCard
					description={t("admin.products.subtitle")}
					icon={LuPackage}
					title={t("admin.products.title")}
					to="/admin/products"
				/>
				<AdminSectionCard
					description={t("admin.categories.subtitle")}
					icon={LuLayoutGrid}
					title={t("admin.categories.title")}
					to="/admin/categories"
				/>
				<AdminSectionCard
					description={t("admin.tags.subtitle")}
					icon={LuTag}
					title={t("admin.tags.title")}
					to="/admin/tags"
				/>
				<AdminSectionCard
					description={t("admin.staff.subtitle")}
					icon={LuUsers}
					title={t("admin.staff.title")}
					to="/admin/staff"
				/>
				<AdminSectionCard
					description={t("admin.orders.subtitle")}
					icon={LuClipboardList}
					title={t("admin.orders.title")}
					to="/admin/orders"
				/>
				<AdminSectionCard
					description={t("admin.kitchen.subtitle")}
					icon={LuUtensilsCrossed}
					title={t("admin.kitchen.title")}
					to="/admin/kitchen"
				/>
				<AdminSectionCard
					description={t("admin.reports.subtitle")}
					icon={LuChartBar}
					title={t("admin.reports.title")}
					to="/admin/reports"
				/>
				<AdminSectionCard
					description={t("admin.reviews.subtitle")}
					icon={LuStar}
					title={t("admin.reviews.title")}
					to="/admin/reviews"
				/>
				{isSuperAdmin(role) && (
					<AdminSectionCard
						description={t("admin.companies.subtitle")}
						icon={LuBuilding2}
						title={t("admin.companies.title")}
						to="/admin/companies"
					/>
				)}
			</div>
		</Container>
	);
}

export const Route = createFileRoute("/admin/")({
	beforeLoad: requireStaffBeforeLoad,
	component: AdminDashboardPage,
});
