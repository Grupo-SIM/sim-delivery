import { useLiveBranding } from "@/hooks/use-live-branding";
import { cn } from "@/lib/utils";

interface BrandMarkProps {
	className?: string;
	showWordmark?: boolean;
	variant?: "default" | "inverse";
}

export function BrandMark({ className, showWordmark = true, variant = "default" }: BrandMarkProps) {
	const { companyName } = useLiveBranding();
	const inverse = variant === "inverse";
	const initials = companyName
		.split(/\s+/)
		.filter(Boolean)
		.slice(0, 2)
		.map(word => word[0]?.toUpperCase())
		.join("");

	return (
		<div className={cn("flex items-center gap-2", className)}>
			<span
				aria-hidden
				className={cn(
					"inline-flex h-8 w-8 items-center justify-center rounded-full font-display text-sm",
					inverse ? "bg-white text-black" : "bg-black text-white",
				)}
			>
				{initials}
			</span>
			{showWordmark && (
				<span className={cn("font-display text-lg tracking-wide", inverse && "text-white")}>
					{companyName}
				</span>
			)}
		</div>
	);
}
