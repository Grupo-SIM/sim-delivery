import { useTranslation } from "react-i18next";
import { LuImageOff } from "react-icons/lu";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { StarRating } from "@/components/ui/StarRating";
import { type MenuItem, money } from "./types";

interface MenuItemCardProps {
	item: MenuItem;
	onSelect: (item: MenuItem) => void;
}

export function MenuItemCard({ item, onSelect }: MenuItemCardProps) {
	const { t } = useTranslation();
	const hasGroups = item.optionGroups.length > 0;

	const displayPrice = money.format(Number(hasGroups ? item.fromPriceCents : item.priceCents) / 100);
	const isPromotional = Number(item.priceCents) < Number(item.regularPriceCents);

	return (
		<Card
			className="group flex h-full cursor-pointer flex-col overflow-hidden p-0 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg"
			onClick={() => onSelect(item)}
			onKeyDown={event => {
				if (event.key === "Enter" || event.key === " ") {
					event.preventDefault();
					onSelect(item);
				}
			}}
			role="button"
			tabIndex={0}
		>
			<div className="aspect-[4/3] w-full overflow-hidden bg-muted">
				{item.imageUrl ? (
					<img
						alt={item.title}
						className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
						loading="lazy"
						src={item.imageUrl}
					/>
				) : (
					<div className="flex h-full items-center justify-center text-muted-foreground/60">
						<LuImageOff aria-label={t("store.menu.imagePlaceholder")} className="size-10" />
					</div>
				)}
			</div>
			<div className="flex min-w-0 flex-1 flex-col gap-2 p-4">
				<p className="font-semibold leading-tight">{item.title}</p>
				{Number(item.ratingCount) > 0 && (
					<StarRating average={item.ratingAverage} count={Number(item.ratingCount)} />
				)}
				{item.tags.length > 0 && (
					<div className="flex flex-wrap gap-1">
						{item.tags.map(tag => (
							<Badge key={tag.id} style={{ borderColor: tag.color, color: tag.color }}>
								{tag.name}
							</Badge>
						))}
					</div>
				)}
				{item.description && (
					<p className="line-clamp-3 text-muted-foreground text-sm leading-relaxed">{item.description}</p>
				)}
				<div className="mt-auto flex items-end gap-2 pt-2">
					<div>
						{isPromotional && <span className="mr-2 text-muted-foreground text-xs line-through">{money.format(Number(item.regularPriceCents) / 100)}</span>}
						{hasGroups && (
							<span className="block text-[11px] text-muted-foreground">{t("store.product.from")}</span>
						)}
						<span className="font-bold text-lg">{displayPrice}</span>
						{isPromotional && <Badge className="ml-2 border-green-500/30 bg-green-500/10 text-green-600">Oferta</Badge>}
					</div>
					{item.cashbackPercent != null && (
						<Badge className="border-green-500/30 bg-green-500/10 text-green-500">
							{item.cashbackPercent}%
						</Badge>
					)}
				</div>
			</div>
		</Card>
	);
}
