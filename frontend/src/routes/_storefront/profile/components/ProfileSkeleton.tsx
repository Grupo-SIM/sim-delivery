import { Container } from "@/components/ui/Container";
import { Skeleton } from "@/components/ui/Skeleton";

export function ProfileSkeleton() {
	return (
		<Container className="max-w-xl space-y-6 py-8">
			<div className="space-y-2">
				<Skeleton className="h-8 w-56" />
				<Skeleton className="h-4 w-80 max-w-full" />
			</div>
			<Skeleton className="h-64 w-full" />
			<Skeleton className="h-96 w-full" />
			<Skeleton className="h-80 w-full" />
		</Container>
	);
}
