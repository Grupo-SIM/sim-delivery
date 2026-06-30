import { cn } from "@/lib/utils";

interface SkeletonProps {
	className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
	return <div aria-hidden className={cn("animate-pulse rounded-md bg-muted/40", className)} />;
}
