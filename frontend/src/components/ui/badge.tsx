import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { cn } from "@/lib/utils";

type BadgeTone = "primary" | "accent" | "cyan" | "success" | "danger" | "neutral";

interface BadgeProps extends ComponentPropsWithoutRef<"span"> {
	children: ReactNode;
	tone?: BadgeTone;
}

const toneClassName: Record<BadgeTone, string> = {
	accent: "border-brand-yellow-dark/40 bg-brand-yellow/20 text-brand-blue",
	cyan: "border-brand-cyan-deep/40 bg-brand-cyan/15 text-brand-cyan-deep",
	danger: "border-destructive/30 bg-destructive/10 text-destructive",
	neutral: "border-border bg-muted text-muted-foreground",
	primary: "border-primary/30 bg-primary/10 text-primary",
	success: "border-whatsapp/40 bg-whatsapp/15 text-whatsapp",
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
