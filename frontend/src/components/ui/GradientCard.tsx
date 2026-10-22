import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { cn } from "@/lib/utils";

type GradientCardTone = "primary" | "accent" | "secondary" | "inverse";

interface GradientCardProps extends ComponentPropsWithoutRef<"div"> {
	children: ReactNode;
	tone?: GradientCardTone;
}

/**
 * Signature storefront product card: a heavily-rounded, panel that
 * lifts on hover. Uses the same semantic surface/text pairs as other brand components.
 */
const toneClassName: Record<GradientCardTone, string> = {
	primary: "bg-primary text-primary-foreground",
	secondary: "bg-secondary text-secondary-foreground",
	inverse: "bg-foreground text-background",
	accent: "bg-accent text-accent-foreground",
};

export function GradientCard({ children, className, tone = "primary", ...props }: GradientCardProps) {
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
