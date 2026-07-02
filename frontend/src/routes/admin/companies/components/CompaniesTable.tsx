import { useTranslation } from "react-i18next";
import type { GetCompanies200 } from "@/lib/api";
import { DataTable } from "@/components/ui/DataTable";
import { EmptyState } from "@/components/ui/EmptyState";
import { CompanyRow } from "./CompanyRow";

interface CompaniesTableProps {
	companies: GetCompanies200;
}

export function CompaniesTable({ companies }: CompaniesTableProps) {
	const { t } = useTranslation();

	if (companies.length === 0) {
		return <EmptyState title={t("admin.companies.empty")} />;
	}

	return (
		<DataTable>
			<thead>
				<tr className="border-border border-b text-left text-muted-foreground">
					<th className="px-4 py-3 font-medium">{t("admin.companies.columns.name")}</th>
					<th className="px-4 py-3 font-medium">{t("admin.companies.columns.slug")}</th>
					<th className="px-4 py-3 font-medium">{t("admin.companies.columns.variant")}</th>
					<th className="px-4 py-3 font-medium">{t("admin.companies.columns.createdAt")}</th>
					<th className="px-4 py-3" />
				</tr>
			</thead>
			<tbody>
				{companies.map(company => (
					<CompanyRow company={company} key={company.id} />
				))}
			</tbody>
		</DataTable>
	);
}
