import { useTranslation } from "react-i18next";
import { LuStar } from "react-icons/lu";
import { cn } from "@/lib/utils";

interface StarRatingProps {
	average: number | null;
	className?: string;
	count: number;
}

export function StarRating({ average, className, count }: StarRatingProps) {
	const { t } = useTranslation();

	if (average === null || count === 0) {
		return <span className={cn("text-muted-foreground text-xs", className)}>{t("rating.none")}</span>;
	}

	return (
		<span className={cn("inline-flex items-center gap-1 text-sm", className)}>
			<LuStar aria-hidden className="size-4 fill-accent text-accent" />
			<span className="font-medium">{average.toFixed(1)}</span>
			<span className="text-muted-foreground text-xs">({t("rating.count", { count })})</span>
		</span>
	);
}
