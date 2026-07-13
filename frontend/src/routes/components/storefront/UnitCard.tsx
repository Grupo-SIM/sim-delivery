import { Link } from "@tanstack/react-router";
import { LuBike, LuClock3, LuMapPin, LuShoppingBag } from "react-icons/lu";
import { Badge } from "@/components/ui/badge";
import type { PublicUnit } from "./types";

interface UnitCardProps {
	unit: PublicUnit;
}

function formatCurrency(cents: number) {
	return new Intl.NumberFormat("pt-BR", { currency: "BRL", style: "currency" }).format(cents / 100);
}

function toPhraseCase(value: string) {
	return value.charAt(0).toLocaleUpperCase("pt-BR") + value.slice(1).toLocaleLowerCase("pt-BR");
}

export function UnitCard({ unit }: UnitCardProps) {
	const address = [unit.addressLine, unit.neighborhood, unit.city].filter(Boolean).join(", ");
	const prepTime =
		unit.prepTimeMinMinutes !== null && unit.prepTimeMaxMinutes !== null
			? `${unit.prepTimeMinMinutes}–${unit.prepTimeMaxMinutes} min`
			: null;
	const hasDelivery = unit.deliveryMethods.includes("delivery");
	const hasPickup = unit.deliveryMethods.includes("pickup");
	const deliveryFee = Number(unit.deliveryFee);
	const minOrderCents = Number(unit.minOrderCents);

	return (
		<Link
			className="group relative flex min-h-64 flex-col overflow-hidden rounded-2xl border border-border bg-card p-5 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-primary/60 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
			params={{ unitId: unit.slug }}
			to="/$unitId"
		>
			<div className="absolute inset-x-0 top-0 h-1 bg-primary transition-all duration-300 group-hover:h-2" />
			<div className="flex items-start justify-between gap-3 pt-2">
				<div>
						<p className="font-display text-xl tracking-wide">{toPhraseCase(unit.name)}</p>
					<p className="mt-2 flex items-start gap-2 text-muted-foreground text-sm">
						<LuMapPin aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
						<span>{address || "Endereço não informado"}</span>
					</p>
				</div>
				<Badge className={unit.isOpenNow ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600" : "border-muted-foreground/30 bg-muted text-muted-foreground"}>
					<span className={unit.isOpenNow ? "mr-1.5 h-1.5 w-1.5 rounded-full bg-emerald-500" : "mr-1.5 h-1.5 w-1.5 rounded-full bg-muted-foreground"} />
					{unit.isOpenNow ? "Aberto agora" : "Fechado"}
				</Badge>
			</div>

			<div className="mt-auto grid grid-cols-2 gap-2 border-border/70 border-t pt-4 text-xs">
				{prepTime && <Indicator Icon={LuClock3} label="Preparo" value={prepTime} />}
				{hasDelivery && <Indicator Icon={LuBike} label="Entrega" value={deliveryFee > 0 ? formatCurrency(deliveryFee) : "Grátis"} />}
				{hasPickup && <Indicator Icon={LuShoppingBag} label="Retirada" value="Disponível" />}
				{minOrderCents > 0 && <Indicator Icon={LuShoppingBag} label="Pedido mínimo" value={formatCurrency(minOrderCents)} />}
			</div>
		</Link>
	);
}

function Indicator({ Icon, label, value }: { Icon: typeof LuBike; label: string; value: string }) {
	return (
		<div className="flex min-w-0 items-center gap-2 rounded-lg bg-muted/50 p-2.5">
			<Icon aria-hidden className="h-4 w-4 shrink-0 text-primary" />
			<span className="min-w-0">
				<span className="block text-muted-foreground">{label}</span>
				<span className="block truncate font-medium text-foreground">{value}</span>
			</span>
		</div>
	);
}
