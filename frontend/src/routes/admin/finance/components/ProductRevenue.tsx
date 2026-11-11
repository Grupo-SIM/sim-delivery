import { DataTable } from "@/components/ui/DataTable";
import { Skeleton } from "@/components/ui/Skeleton";

interface ProductRevenueProps {
	formatCents: (value: number) => string;
	isError: boolean;
	isPending: boolean;
	rows: { productId: string; productName: string; totalQuantity: number; totalRevenue: number }[];
}

export function ProductRevenue({ formatCents, isError, isPending, rows }: ProductRevenueProps) {
	const total = rows.reduce((sum, row) => sum + row.totalRevenue, 0);

	return (
		<section>
			<h2 className="mb-3 font-semibold text-base">Receita por produto</h2>
			<DataTable tableClassName="!min-w-0 table-fixed">
				<thead>
					<tr className="border-border border-b text-left text-muted-foreground">
						<th className="p-3">Produto</th>
						<th className="p-3 text-right">Qtd.</th>
						<th className="p-3 text-right">Receita</th>
						<th className="p-3 text-right">% do total</th>
					</tr>
				</thead>
				<tbody>
					{isPending ? (
						<tr>
							<td className="p-3">
								<Skeleton className="h-4 w-32" />
							</td>
							<td className="p-3 text-right">
								<Skeleton className="ml-auto h-4 w-8" />
							</td>
							<td className="p-3 text-right">
								<Skeleton className="ml-auto h-4 w-20" />
							</td>
							<td className="p-3 text-right">
								<Skeleton className="ml-auto h-4 w-10" />
							</td>
						</tr>
					) : isError || rows.length === 0 ? (
						<tr>
							<td className="p-8 text-center text-muted-foreground" colSpan={4}>
								{isError ? "Não foi possível carregar a receita por produto." : "Sem dados no período."}
							</td>
						</tr>
					) : (
						rows.map(row => (
							<tr className="border-border/60 border-b last:border-0" key={row.productId}>
								<td className="truncate p-3">{row.productName}</td>
								<td className="p-3 text-right">{row.totalQuantity}</td>
								<td className="p-3 text-right font-medium">{formatCents(row.totalRevenue)}</td>
								<td className="p-3 text-right text-muted-foreground">
									{total ? `${((row.totalRevenue / total) * 100).toFixed(1)}%` : "—"}
								</td>
							</tr>
						))
					)}
				</tbody>
			</DataTable>
		</section>
	);
}
