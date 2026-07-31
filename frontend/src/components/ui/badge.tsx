import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { cn } from "@/lib/utils";

type BadgeTone = "primary" | "accent" | "cyan" | "success" | "danger" | "neutral";

interface BadgeProps extends ComponentPropsWithoutRef<"span"> {
	children: ReactNode;
	tone?: BadgeTone;
}

const toneClassName: Record<BadgeTone, string> = {
	accent: "border-accent/40 bg-accent/20 text-accent",
	cyan: "border-secondary/40 bg-secondary/15 text-secondary",
	danger: "border-destructive/30 bg-destructive/10 text-destructive",
	neutral: "border-border bg-muted text-muted-foreground",
	primary: "border-primary/30 bg-primary/10 text-primary",
	success: "border-success/40 bg-success/15 text-success",
};

export function Badge({ children, className, tone = "primary", ...props }: BadgeProps) {
	return (
		<span
			className={cn(
				"inline-flex w-fit items-center rounded-pill border px-2.5 py-1 font-semibold text-xs uppercase tracking-wide",
				toneClassName[tone],
				className,
			)}
			{...props}
		>
			{children}
		</span>
	);
}
