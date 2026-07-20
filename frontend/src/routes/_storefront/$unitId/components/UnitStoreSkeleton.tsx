import { Container } from "@/components/ui/Container";
import { Skeleton } from "@/components/ui/Skeleton";

export function UnitStoreSkeleton() {
	return (
		<>
			<Skeleton className="h-40 w-full rounded-none sm:h-56" />
			<Container className="space-y-6 py-8">
				<div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
					<div className="space-y-2">
						<Skeleton className="h-8 w-56 max-w-full" />
						<Skeleton className="h-4 w-80 max-w-full" />
					</div>
					<Skeleton className="h-10 w-44" />
				</div>
				<div className="space-y-3">
					<Skeleton className="h-12 w-full" />
					<Skeleton className="h-44 w-full" />
					<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
						<Skeleton className="h-56 w-full" />
						<Skeleton className="h-56 w-full" />
						<Skeleton className="h-56 w-full" />
					</div>
				</div>
			</Container>
		</>
	);
}
