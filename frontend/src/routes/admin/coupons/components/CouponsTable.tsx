import { useTranslation } from "react-i18next";
import { DataTable } from "@/components/ui/DataTable";
import { EmptyState } from "@/components/ui/EmptyState";
import type { GetCoupons200, GetUnits200 } from "@/lib/api";
import { CouponRow } from "./CouponRow";

interface CouponsTableProps {
	coupons: GetCoupons200;
	units: GetUnits200 | undefined;
}

export function CouponsTable({ coupons, units }: CouponsTableProps) {
	const { t } = useTranslation();

	if (coupons.length === 0) return <EmptyState title={t("admin.coupons.empty")} />;

	return (
		<DataTable>
			<thead>
				<tr className="border-border border-b text-left text-muted-foreground">
					<th className="px-4 py-3 font-medium">{t("admin.coupons.columns.code")}</th>
					<th className="px-4 py-3 font-medium">{t("admin.coupons.columns.type")}</th>
					<th className="px-4 py-3 font-medium">{t("admin.coupons.columns.value")}</th>
					<th className="px-4 py-3 font-medium">{t("admin.coupons.columns.unit")}</th>
					<th className="px-4 py-3 font-medium">{t("admin.coupons.columns.expiresAt")}</th>
					<th className="px-4 py-3" />
				</tr>
			</thead>
			<tbody>
				{coupons.map(coupon => (
					<CouponRow coupon={coupon} key={coupon.id} units={units} />
				))}
			</tbody>
		</DataTable>
	);
}
