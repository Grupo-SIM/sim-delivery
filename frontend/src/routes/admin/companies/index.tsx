import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Container } from "@/components/ui/Container";
import { ErrorState } from "@/components/ui/ErrorState";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Skeleton } from "@/components/ui/Skeleton";
import { TextField } from "@/components/ui/TextField";
import { useGetCompanies } from "@/lib/api";
import { requireSuperAdminBeforeLoad } from "@/lib/super-admin-guard";
import { CompaniesTable, CreateCompanyForm } from "./components";

function CompaniesPage() {
	const { t } = useTranslation();
	const { data: companies, isError, isPending } = useGetCompanies();
	const [search, setSearch] = useState("");

	const filteredCompanies = useMemo(() => {
		if (!companies) return companies;
		const query = search.trim().toLowerCase();
		if (!query) return companies;
		return companies.filter(
			company => company.name.toLowerCase().includes(query) || company.slug.toLowerCase().includes(query),
		);
	}, [companies, search]);

	return (
		<Container className="space-y-6 py-8">
			<SectionHeading subtitle={t("admin.companies.subtitle")} title={t("admin.companies.title")} />

			<CreateCompanyForm />

			<div className="max-w-sm">
				<TextField
					label={t("admin.companies.search.label")}
					onValueChange={setSearch}
					placeholder={t("admin.companies.search.placeholder")}
					value={search}
				/>
			</div>

			{isPending ? (
				<Skeleton className="h-40 w-full" />
			) : isError ? (
				<ErrorState title={t("admin.companies.loadError")} />
			) : (
				<CompaniesTable companies={filteredCompanies ?? []} />
			)}
		</Container>
	);
}

export const Route = createFileRoute("/admin/companies/")({
	beforeLoad: requireSuperAdminBeforeLoad,
	component: CompaniesPage,
});
