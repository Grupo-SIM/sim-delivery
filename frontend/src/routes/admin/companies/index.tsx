import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { useGetCompanies } from "@/lib/api";
import { Container } from "@/components/ui/Container";
import { ErrorState } from "@/components/ui/ErrorState";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Skeleton } from "@/components/ui/Skeleton";
import { requireSuperAdminBeforeLoad } from "@/lib/super-admin-guard";
import { CompaniesTable, CreateCompanyForm } from "./components";

function CompaniesPage() {
	const { t } = useTranslation();
	const { data: companies, isError, isPending } = useGetCompanies();

	return (
		<Container className="space-y-6 py-8">
			<SectionHeading subtitle={t("admin.companies.subtitle")} title={t("admin.companies.title")} />

			<CreateCompanyForm />

			{isPending ? (
				<Skeleton className="h-40 w-full" />
			) : isError ? (
				<ErrorState title={t("admin.companies.loadError")} />
			) : (
				<CompaniesTable companies={companies} />
			)}
		</Container>
	);
}

export const Route = createFileRoute("/admin/companies/")({
	beforeLoad: requireSuperAdminBeforeLoad,
	component: CompaniesPage,
});
