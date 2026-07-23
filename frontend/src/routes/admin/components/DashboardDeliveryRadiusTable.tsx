import { DataTable } from "@/components/ui/DataTable";

interface DashboardDeliveryRadiusTableProps {
	columns: { deliveryFee: string; orderCount: string; radius: string; revenue: string; unit: string };
	formatCents: (cents: number) => string;
	noRadius: string;
	rows: {
		deliveryFee: number | string;
		orderCount: number | string;
		radiusKm: number | null;
		totalRevenue: number | string;
		unitId: string;
		unitName: string;
	}[];
	title: string;
}

export function DashboardDeliveryRadiusTable({
	columns,
	formatCents,
	noRadius,
	rows,
	title,
}: DashboardDeliveryRadiusTableProps) {
	return (
		<section>
			<h2 className="mb-3 font-semibold text-base">{title}</h2>
			<DataTable tableClassName="min-w-[640px]">
				<thead>
					<tr className="border-border border-b text-left text-muted-foreground">
						<th className="px-4 py-3 font-medium">{columns.unit}</th>
						<th className="px-4 py-3 font-medium">{columns.radius}</th>
						<th className="px-4 py-3 text-right font-medium">{columns.deliveryFee}</th>
						<th className="px-4 py-3 text-right font-medium">{columns.orderCount}</th>
						<th className="px-4 py-3 text-right font-medium">{columns.revenue}</th>
					</tr>
				</thead>
				<tbody>
					{rows.map(row => (
						<tr className="border-border/60 border-b last:border-0" key={`${row.unitId}-${row.radiusKm}-${row.deliveryFee}`}>
							<td className="px-4 py-3 font-medium">{row.unitName}</td>
							<td className="px-4 py-3 text-muted-foreground">{row.radiusKm === null ? noRadius : `≤ ${row.radiusKm} km`}</td>
							<td className="px-4 py-3 text-right">{formatCents(Number(row.deliveryFee))}</td>
							<td className="px-4 py-3 text-right">{Number(row.orderCount)}</td>
							<td className="px-4 py-3 text-right font-medium">{formatCents(Number(row.totalRevenue))}</td>
						</tr>
					))}
				</tbody>
			</DataTable>
		</section>
	);
}
