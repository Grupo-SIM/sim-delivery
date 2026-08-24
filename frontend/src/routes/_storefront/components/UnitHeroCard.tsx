import { Link } from "@tanstack/react-router";
import { LuArrowRight, LuClock3, LuMapPin } from "react-icons/lu";
import { cn } from "@/lib/utils";
import type { PublicUnit } from "../../components/storefront/types";

interface UnitHeroCardProps {
	fallbackImageUrl?: string | null;
	openLabel: string;
	unit: PublicUnit;
}

export function UnitHeroCard({ fallbackImageUrl, openLabel, unit }: UnitHeroCardProps) {
	const address = [unit.addressLine, unit.neighborhood, unit.city].filter(Boolean).join(", ");
	const imageUrl = unit.imageUrl || fallbackImageUrl;
	const prepTime =
		unit.prepTimeMinMinutes !== null && unit.prepTimeMaxMinutes !== null
			? `${unit.prepTimeMinMinutes}-${unit.prepTimeMaxMinutes} min`
			: null;

	return (
		<Link
			className={cn(
				"group relative min-h-80 overflow-hidden rounded-lg bg-primary shadow-md transition-shadow duration-300 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
				imageUrl ? "text-white" : "text-primary-foreground",
			)}
			params={{ unitId: unit.slug }}
			to="/$unitId"
		>
			{imageUrl && (
				<img
					alt={`Unidade ${unit.name}`}
					className="absolute inset-0 h-full w-full object-cover opacity-75 transition duration-500 group-hover:scale-105"
					src={imageUrl}
				/>
			)}
			{imageUrl && <div className="absolute inset-0 bg-black/50" />}
			<div className="relative flex min-h-80 flex-col justify-between p-6">
				<div className="flex items-start justify-between gap-4">
					<span className="rounded-full bg-background/90 px-3 py-1.5 font-semibold text-foreground text-xs">
						{unit.isOpenNow ? openLabel : "Fechado"}
					</span>
					<LuArrowRight aria-hidden className="size-6 transition-transform group-hover:translate-x-1" />
				</div>
				<div>
					<p className="font-display text-4xl">{unit.name}</p>
					{address && (
						<p className="mt-3 flex items-center gap-2 text-sm text-white/90">
							<LuMapPin className="size-4" />
							{address}
						</p>
					)}
					{prepTime && (
						<p className="mt-1 flex items-center gap-2 text-sm text-white/90">
							<LuClock3 className="size-4" />
							{prepTime}
						</p>
					)}
				</div>
			</div>
		</Link>
	);
}
