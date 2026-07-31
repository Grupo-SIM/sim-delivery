import { DataTable } from "@/components/ui/DataTable";
import { Skeleton } from "@/components/ui/Skeleton";

interface FinancialDistributionProps {
	empty: string;
	formatCents: (value: number) => string;
	isPending: boolean;
	rows: { method: string; netRevenueCents: number; orderCount: number }[];
	title: string;
	unreported: string;
}

export function FinancialDistribution({
	empty,
	formatCents,
	isPending,
	rows,
	title,
	unreported,
}: FinancialDistributionProps) {
	return (
		<section>
			<h2 className="mb-3 font-semibold text-base">{title}</h2>
			<DataTable tableClassName="!min-w-0 table-fixed">
				<thead>
					<tr className="border-border border-b text-left text-muted-foreground">
						<th className="p-3">Método</th>
						<th className="p-3 text-right">Pedidos</th>
						<th className="p-3 text-right">Receita líquida</th>
					</tr>
				</thead>
				<tbody>
					{isPending ? (
						<tr>
							<td className="p-3"><Skeleton className="h-4 w-24" /></td>
							<td className="p-3 text-right"><Skeleton className="ml-auto h-4 w-8" /></td>
							<td className="p-3 text-right"><Skeleton className="ml-auto h-4 w-20" /></td>
						</tr>
					) : rows.length === 0 ? (
						<tr>
							<td className="p-8 text-center text-muted-foreground" colSpan={3}>{empty}</td>
						</tr>
					) : (
						rows.map(row => (
							<tr className="border-border/60 border-b last:border-0" key={row.method}>
								<td className="p-3">{row.method === "unreported" ? unreported : row.method}</td>
								<td className="p-3 text-right">{row.orderCount}</td>
								<td className="p-3 text-right font-medium">{formatCents(row.netRevenueCents)}</td>
							</tr>
						))
					)}
				</tbody>
			</DataTable>
		</section>
	);
}
