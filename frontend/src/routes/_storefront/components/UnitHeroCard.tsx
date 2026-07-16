import { Link } from "@tanstack/react-router";
import { LuArrowRight, LuClock3, LuMapPin } from "react-icons/lu";
import type { PublicUnit } from "../../components/storefront/types";

interface UnitHeroCardProps {
	openLabel: string;
	unit: PublicUnit;
}

const fallbackImageUrl = "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1200&q=85";

export function UnitHeroCard({ openLabel, unit }: UnitHeroCardProps) {
	const address = [unit.addressLine, unit.neighborhood, unit.city].filter(Boolean).join(", ");
	const prepTime =
		unit.prepTimeMinMinutes !== null && unit.prepTimeMaxMinutes !== null
			? `${unit.prepTimeMinMinutes}-${unit.prepTimeMaxMinutes} min`
			: null;

	return (
		<Link
			className="group relative min-h-80 overflow-hidden rounded-lg bg-brand-blue text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
			params={{ unitId: unit.slug }}
			to="/$unitId"
		>
			<img
				alt={`Unidade ${unit.name}`}
				className="absolute inset-0 h-full w-full object-cover opacity-75 transition duration-500 group-hover:scale-105"
				src={unit.bannerUrl || fallbackImageUrl}
			/>
			<div className="absolute inset-0 bg-black/35" />
			<div className="relative flex min-h-80 flex-col justify-between p-6">
				<div className="flex items-start justify-between gap-4">
					<span className="rounded-full bg-white/90 px-3 py-1.5 font-semibold text-brand-ink text-xs">
						{unit.isOpenNow ? openLabel : "Fechado"}
					</span>
					<LuArrowRight aria-hidden className="size-6 transition-transform group-hover:translate-x-1" />
				</div>
				<div>
					<p className="font-display text-4xl">{unit.name}</p>
					{address && <p className="mt-3 flex items-center gap-2 text-sm text-white/90"><LuMapPin className="size-4" />{address}</p>}
					{prepTime && <p className="mt-1 flex items-center gap-2 text-sm text-white/90"><LuClock3 className="size-4" />{prepTime}</p>}
				</div>
			</div>
		</Link>
	);
}
