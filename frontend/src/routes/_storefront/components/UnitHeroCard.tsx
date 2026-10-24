import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { useLiveBranding } from "@/hooks/use-live-branding";
import { cn } from "@/lib/utils";
import type { PublicUnit } from "../../components/storefront/types";

interface UnitHeroCardProps {
	openLabel: string;
	unit: PublicUnit;
}

export function UnitHeroCard({ openLabel, unit }: UnitHeroCardProps) {
	const { t } = useTranslation();
	const branding = useLiveBranding();
	const imageUrl = unit.imageUrl;
	return (
		<Link
			className={cn(
				"unit-hero-card group relative flex aspect-[1.2] cursor-pointer flex-col justify-between overflow-hidden rounded-3xl bg-secondary p-3 text-secondary-foreground transition-shadow hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:p-5",
				imageUrl && "unit-hero-photo text-primary-foreground",
			)}
			params={{ unitId: unit.slug }}
			search={current => ({ menuOnly: current.menuOnly, taxes: current.taxes })}
			to="/$unitId"
		>
			{imageUrl ? (
				<>
					<img
						alt=""
						className="absolute inset-0 size-full object-cover transition-transform duration-500 group-hover:scale-105"
						src={imageUrl}
					/>
					<div className="absolute inset-0 bg-gradient-to-t from-primary/90 via-primary/10 to-transparent" />
				</>
			) : (
				branding.logoUrl && (
					<img
						alt=""
						className="absolute top-1/2 left-1/2 w-1/3 -translate-x-1/2 -translate-y-1/2 object-contain"
						src={branding.logoUrl}
					/>
				)
			)}
			<span
				className="relative flex w-fit items-center gap-1.5 rounded-full bg-card text-card-foreground px-2.5 py-1 font-bold text-xs sm:text-sm"
				style={{ color: unit.isOpenNow ? "var(--card-foreground)" : "var(--muted-foreground)" }}
			>
				<span
					className={cn("size-1.5 rounded-full", unit.isOpenNow ? "bg-success" : "bg-muted-foreground")}
				/>
				{unit.isOpenNow ? openLabel : t("store.status.closed")}
			</span>
			<p className="relative mt-auto font-extrabold text-base leading-tight sm:text-2xl">{unit.name}</p>
		</Link>
	);
}
