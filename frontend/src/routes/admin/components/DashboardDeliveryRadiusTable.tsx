import { DataTable } from "@/components/ui/DataTable";

interface DashboardDeliveryRadiusTableProps {
	columns: { deliveryFee: string; orderCount: string; radius: string; revenue: string; unit: string };
	empty: string;
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
	empty,
	formatCents,
	noRadius,
	rows,
	title,
}: DashboardDeliveryRadiusTableProps) {
	return (
		<section>
			<h2 className="mb-3 font-semibold text-base">{title}</h2>
			<DataTable tableClassName="!min-w-0 table-fixed">
				<colgroup>
					<col className="w-[30%]" />
					<col className="w-[13%]" />
					<col className="w-[18%]" />
					<col className="w-[16%]" />
					<col className="w-[23%]" />
				</colgroup>
				<thead>
					<tr className="border-border border-b text-left text-muted-foreground">
						<th className="py-3 pr-2 pl-4 font-medium">{columns.unit}</th>
						<th className="px-2 py-3 font-medium">{columns.radius}</th>
						<th className="px-2 py-3 text-right font-medium">{columns.deliveryFee}</th>
						<th className="px-2 py-3 text-right font-medium">{columns.orderCount}</th>
						<th className="py-3 pr-4 pl-2 text-right font-medium">{columns.revenue}</th>
					</tr>
				</thead>
				<tbody>
					{rows.length === 0 && (
						<tr>
							<td className="px-6 py-20 text-center font-semibold text-sm" colSpan={5}>
								{empty}
							</td>
						</tr>
					)}
					{rows.map(row => (
						<tr
							className="border-border/60 border-b last:border-0"
							key={`${row.unitId}-${row.radiusKm}-${row.deliveryFee}`}
						>
							<td className="py-3 pr-2 pl-4 font-medium">{row.unitName}</td>
							<td className="px-2 py-3 text-muted-foreground">
								{row.radiusKm === null ? noRadius : `≤ ${row.radiusKm} km`}
							</td>
							<td className="px-2 py-3 text-right">{formatCents(Number(row.deliveryFee))}</td>
							<td className="px-2 py-3 text-right">{Number(row.orderCount)}</td>
							<td className="py-3 pr-4 pl-2 text-right font-medium">
								{formatCents(Number(row.totalRevenue))}
							</td>
						</tr>
					))}
				</tbody>
			</DataTable>
		</section>
	);
}
