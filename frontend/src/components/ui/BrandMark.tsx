import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

interface BrandMarkProps {
	className?: string;
	showWordmark?: boolean;
	variant?: "default" | "inverse";
}

export function BrandMark({ className, showWordmark = true, variant = "default" }: BrandMarkProps) {
	const { t } = useTranslation();
	const inverse = variant === "inverse";

	return (
		<div className={cn("flex items-center gap-2", className)}>
			<span
				aria-hidden
				className={cn(
					"inline-flex h-8 w-8 items-center justify-center rounded-full font-display text-sm",
					inverse ? "bg-white text-brand-blue" : "bg-brand-blue text-white",
				)}
			>
				ZG
			</span>
			{showWordmark && (
				<span className={cn("font-display text-lg tracking-wide", inverse && "text-white")}>
					{t("app.name")}
				</span>
			)}
		</div>
	);
}
