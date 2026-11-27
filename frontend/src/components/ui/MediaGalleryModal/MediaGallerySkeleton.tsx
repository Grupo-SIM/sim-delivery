import { Skeleton } from "../Skeleton";

interface MediaGallerySkeletonProps {
	count?: number;
}

/** Mirrors `MediaGalleryItem`: square image plus three caption lines. */
export function MediaGallerySkeleton({ count = 8 }: MediaGallerySkeletonProps) {
	return Array.from({ length: count }, (_, index) => (
		<div className="flex flex-col overflow-hidden rounded-md border border-border" key={index}>
			<Skeleton className="aspect-square w-full rounded-none" />
			<div className="grid gap-1.5 border-border border-t px-2 py-2">
				<Skeleton className="h-3 w-3/4" />
				<Skeleton className="h-3 w-1/2" />
				<Skeleton className="h-3 w-1/3" />
			</div>
		</div>
	));
}
