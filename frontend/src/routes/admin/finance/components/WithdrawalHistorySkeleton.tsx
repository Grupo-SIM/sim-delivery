import { DataTable } from "@/components/ui/DataTable";
import { Skeleton } from "@/components/ui/Skeleton";

export function WithdrawalHistorySkeleton() {
	return (
		<section className="space-y-3">
			<Skeleton className="h-7 w-48" />
			<DataTable>
				<tbody>
					{Array.from({ length: 5 }, (_, index) => (
						<tr className="border-border/60 border-b" key={index}>
							{Array.from({ length: 6 }, (_, column) => (
								<td className="px-4 py-4" key={column}>
									<Skeleton className="h-4 w-full" />
								</td>
							))}
						</tr>
					))}
				</tbody>
			</DataTable>
		</section>
	);
}
