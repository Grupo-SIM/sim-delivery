import { useTranslation } from "react-i18next";
import type { GetCompanies200 } from "@/lib/api";
import { DataTable } from "@/components/ui/DataTable";
import { EmptyState } from "@/components/ui/EmptyState";

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
				</tr>
			</thead>
			<tbody>
				{companies.map(company => (
					<tr className="border-border border-b" key={company.id}>
						<td className="px-4 py-3">{company.name}</td>
						<td className="px-4 py-3">{company.slug}</td>
						<td className="px-4 py-3">{company.variantKey ?? t("admin.companies.variantUnset")}</td>
						<td className="px-4 py-3">{new Date(company.createdAt).toLocaleDateString()}</td>
					</tr>
				))}
			</tbody>
		</DataTable>
	);
}
