import { Skeleton } from "@/components/ui/Skeleton";

export function StorefrontBannerSkeleton() {
	return (
		<div className="border-border/70 border-b bg-muted/50 sm:px-5 sm:py-4">
			<Skeleton className="mx-auto aspect-[11/4] w-full max-w-5xl rounded-none sm:rounded-xl" />
		</div>
	);
}
