import { useTranslation } from "react-i18next";
import { LuPlus } from "react-icons/lu";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { StarRating } from "@/components/ui/StarRating";
import { useLiveBranding } from "@/hooks/use-live-branding";
import { displayedUnitPrice, feeUnitAmount, normalizeProductFees } from "@/lib/platform-fees";
import { hasPriceVariation } from "./product-options";
import { type MenuItem, money } from "./types";

interface MenuItemCardProps {
	item: MenuItem;
	onSelect: (item: MenuItem) => void;
}

export function MenuItemCard({ item, onSelect }: MenuItemCardProps) {
	const { t } = useTranslation();
	const { mobileIconUrl } = useLiveBranding();
	const showFromPrice = hasPriceVariation(item.optionGroups);

	const displayPriceCents = displayedUnitPrice(Number(item.fromPriceCents), item.productFees);
	const productFees = normalizeProductFees(item.productFees);
	const displayPrice = money.format(displayPriceCents / 100);
	const isPromotional = Number(item.priceCents) < Number(item.regularPriceCents);

	return (
		<Card
			className="menu-item-card group flex h-full cursor-pointer flex-col overflow-hidden p-0 shadow-md transition duration-300 hover:-translate-y-0.5 hover:shadow-lg"
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
					<div className="flex h-full items-center justify-center bg-[#F1E6D6] text-muted-foreground/60">
						<img
							alt={t("store.menu.imagePlaceholder")}
							className="w-1/3 object-contain"
							src={mobileIconUrl || "/apple-touch-icon.png"}
						/>
					</div>
				)}
			</div>
			<div className="menu-item-content flex min-w-0 flex-1 flex-col gap-2 p-3 sm:p-4">
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
					<p className="line-clamp-2 text-muted-foreground text-sm leading-relaxed sm:line-clamp-3">
						{item.description}
					</p>
				)}
				<div className="mt-auto flex items-end gap-2 pt-2">
					<div>
						{isPromotional && (
							<span className="mr-2 text-muted-foreground text-xs line-through">
								{money.format(Number(item.regularPriceCents) / 100)}
							</span>
						)}
						{showFromPrice && (
							<span className="block text-[11px] text-muted-foreground">{t("store.product.from")}</span>
						)}
						<span className="font-bold text-lg">{displayPrice}</span>
						{productFees
							.filter(fee => fee.displayMode === "product_explicit")
							.map(fee => (
								<span className="block text-muted-foreground text-xs" key={fee.id}>
									+ {fee.name}: {money.format(feeUnitAmount(Number(item.fromPriceCents), fee) / 100)}
								</span>
							))}
						{isPromotional && (
							<Badge className="ml-2 border-success/30 bg-success/10 text-success">Oferta</Badge>
						)}
					</div>
					{item.cashbackPercent != null && (
						<Badge className="border-success/30 bg-success/10 text-success">{item.cashbackPercent}%</Badge>
					)}
					<span
						aria-hidden
						className="ml-auto grid size-10 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground shadow-md transition-transform group-hover:scale-105"
					>
						<LuPlus className="size-5" />
					</span>
				</div>
			</div>
		</Card>
	);
}
