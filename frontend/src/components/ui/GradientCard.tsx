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
	blue: "bg-linear-135 from-brand-blue to-brand-blue-light text-white",
	cyan: "bg-linear-135 from-brand-cyan to-brand-cyan-deep text-white",
	ink: "bg-linear-135 from-brand-ink to-[#2a2a4a] text-white",
	instagram: "bg-linear-45 from-[#f09433] via-[#dc2743] to-[#bc1888] text-white",
	yellow: "bg-linear-135 from-brand-yellow to-brand-yellow-dark text-brand-blue",
};

export function GradientCard({ children, className, tone = "blue", ...props }: GradientCardProps) {
	return (
		<div
			className={cn(
				"group relative flex overflow-hidden rounded-[var(--radius-brand)] shadow-soft transition-[box-shadow,transform] duration-300 ease-[var(--ease-smooth)] hover:-translate-y-1 hover:shadow-medium",
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
