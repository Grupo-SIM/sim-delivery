import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { cn } from "@/lib/utils";

type GradientCardTone = "blue" | "yellow" | "cyan" | "ink" | "instagram";

interface GradientCardProps extends ComponentPropsWithoutRef<"div"> {
	children: ReactNode;
	tone?: GradientCardTone;
}

/**
 * Signature Zero Grau product card: a heavily-rounded, gradient-filled panel that
 * lifts on hover. Mirrors the storefront hero cards (blue / yellow / cyan).
 */
const toneClassName: Record<GradientCardTone, string> = {
	blue: "bg-linear-135 from-primary to-primary/75 text-primary-foreground",
	cyan: "bg-linear-135 from-secondary to-secondary/75 text-secondary-foreground",
	ink: "bg-linear-135 from-foreground to-foreground/75 text-background",
	instagram: "bg-linear-45 from-primary via-primary/85 to-accent text-primary-foreground",
	yellow: "bg-linear-135 from-accent to-accent/75 text-accent-foreground",
};

export function GradientCard({ children, className, tone = "blue", ...props }: GradientCardProps) {
	return (
		<div
			className={cn(
				"group relative flex overflow-hidden rounded-[var(--radius-brand)] transition-transform duration-300 ease-[var(--ease-smooth)] hover:-translate-y-1",
				toneClassName[tone],
				className,
			)}
			{...props}
		>
			{/* Ambient light spots, matching the storefront card texture */}
			<div
				aria-hidden
				className="pointer-events-none absolute inset-0 [background-image:radial-gradient(circle_at_20%_80%,rgba(255,255,255,0.1)_0%,transparent_50%),radial-gradient(circle_at_80%_20%,rgba(255,255,255,0.07)_0%,transparent_50%)]"
			/>
			<div className="relative z-10 flex w-full items-center justify-between gap-4 p-8">{children}</div>
		</div>
	);
}
