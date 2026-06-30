import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { cn } from "@/lib/utils";

interface IconBadgeProps extends ComponentPropsWithoutRef<"span"> {
	children: ReactNode;
	tone?: "default" | "primary" | "success" | "warning" | "destructive" | "live";
}

const toneClass: Record<NonNullable<IconBadgeProps["tone"]>, string> = {
	default: "bg-muted text-muted-foreground",
	destructive: "bg-destructive/15 text-destructive",
	live: "animate-pulse bg-live/20 text-live",
	primary: "bg-primary/15 text-primary",
	success: "bg-success/15 text-success",
	warning: "bg-warning/15 text-warning",
};

export function IconBadge({ children, className, tone = "default", ...props }: IconBadgeProps) {
	return (
		<span
			className={cn(
				"inline-flex items-center justify-center whitespace-nowrap rounded-full px-2 py-0.5 text-label-bold",
				toneClass[tone],
				className,
			)}
			{...props}
		>
			{children}
		</span>
	);
}
