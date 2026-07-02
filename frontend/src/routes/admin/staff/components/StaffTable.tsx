import { useTranslation } from "react-i18next";
import type { GetStaff200 } from "@/lib/api";
import { DataTable } from "@/components/ui/DataTable";
import { EmptyState } from "@/components/ui/EmptyState";

interface StaffTableProps {
	staff: GetStaff200;
}

export function StaffTable({ staff }: StaffTableProps) {
	const { t } = useTranslation();

	if (staff.length === 0) {
		return <EmptyState title={t("admin.staff.empty")} />;
	}

	return (
		<DataTable>
			<thead>
				<tr className="border-border border-b text-left text-muted-foreground">
					<th className="px-4 py-3 font-medium">{t("admin.staff.columns.name")}</th>
					<th className="px-4 py-3 font-medium">{t("admin.staff.columns.email")}</th>
					<th className="px-4 py-3 font-medium">{t("admin.staff.columns.role")}</th>
					<th className="px-4 py-3 font-medium">{t("admin.staff.columns.level")}</th>
				</tr>
			</thead>
			<tbody>
				{staff.map(member => (
					<tr className="border-border border-b" key={member.id}>
						<td className="px-4 py-3">{member.name}</td>
						<td className="px-4 py-3">{member.email}</td>
						<td className="px-4 py-3">{member.role}</td>
						<td className="px-4 py-3">{member.level ?? t("admin.staff.levels.none")}</td>
					</tr>
				))}
			</tbody>
		</DataTable>
	);
}
