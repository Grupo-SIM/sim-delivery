import { Container } from "@/components/ui/Container";
import { Skeleton } from "@/components/ui/Skeleton";
import { StorefrontBannerSkeleton } from "../../../components/storefront";

export function UnitStoreSkeleton() {
	return (
		<>
			<StorefrontBannerSkeleton />
			<Container className="unit-store-content space-y-6 py-5">
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
					<div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
						<Skeleton className="h-72 w-full rounded-3xl" />
						<Skeleton className="h-72 w-full rounded-3xl" />
						<Skeleton className="h-72 w-full rounded-3xl" />
					</div>
				</div>
			</Container>
		</>
	);
}
