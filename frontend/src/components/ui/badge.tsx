import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { cn } from "@/lib/utils";

type BadgeTone = "primary" | "accent" | "secondary" | "success" | "danger" | "neutral";

interface BadgeProps extends ComponentPropsWithoutRef<"span"> {
	children: ReactNode;
	tone?: BadgeTone;
}

const toneClassName: Record<BadgeTone, string> = {
	accent: "border-accent bg-accent text-accent-foreground",
	secondary: "border-secondary bg-secondary text-secondary-foreground",
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
