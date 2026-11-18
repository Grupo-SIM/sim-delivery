import { useTranslation } from "react-i18next";
import { LuEye, LuPlus } from "react-icons/lu";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { StarRating } from "@/components/ui/StarRating";
import { useLiveBranding } from "@/hooks/use-live-branding";
import { displayedUnitPrice, normalizeProductFees } from "@/lib/platform-fees";
import { cn } from "@/lib/utils";
import { ProductFeeSummary } from "./ProductFeeSummary";
import { hasPriceVariation } from "./product-options";
import { type MenuItem, money } from "./types";

interface MenuItemCardProps {
	item: MenuItem;
	onSelect?: (item: MenuItem) => void;
	menuOnly?: boolean;
	taxes?: boolean;
}

export function MenuItemCard({ item, onSelect, menuOnly = false, taxes = true }: MenuItemCardProps) {
	const { t } = useTranslation();
	const { logoUrl, mobileIconUrl } = useLiveBranding();
	const showFromPrice = hasPriceVariation(item.optionGroups);

	const productFees = normalizeProductFees(taxes ? item.productFees : []);
	const displayPriceCents = displayedUnitPrice(Number(item.fromPriceCents), productFees);
	const displayPrice = money.format(displayPriceCents / 100);
	const isPromotional = Number(item.priceCents) < Number(item.regularPriceCents);
	const discountPercent = isPromotional
		? Math.round((1 - Number(item.priceCents) / Number(item.regularPriceCents)) * 100)
		: 0;

	return (
		<Card
			className={cn("menu-item-card group flex h-full flex-col overflow-hidden p-0 shadow-md", onSelect && "cursor-pointer transition duration-300 hover:-translate-y-0.5 hover:shadow-lg")}
			onClick={onSelect ? () => onSelect(item) : undefined}
			onKeyDown={event => {
				if (onSelect && (event.key === "Enter" || event.key === " ")) {
					event.preventDefault();
					onSelect(item);
				}
			}}
			role={onSelect ? "button" : undefined}
			tabIndex={onSelect ? 0 : undefined}
		>
			<div className="relative aspect-[4/3] w-full overflow-hidden bg-muted">
				{discountPercent > 0 && (
					<span className="absolute top-2 left-2 z-10 rounded-full bg-primary px-2.5 py-1 font-bold text-primary-foreground text-xs shadow-md">
						-{discountPercent}%
					</span>
				)}
				{item.imageUrl ? (
					<img
						alt={item.title}
						className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
						loading="lazy"
						src={item.imageUrl}
					/>
				) : (
					<div className="flex h-full items-center justify-center bg-muted text-muted-foreground/60">
						<img
							alt={t("store.menu.imagePlaceholder")}
							className="w-1/3 object-contain opacity-25 grayscale"
							src={logoUrl || mobileIconUrl || "/apple-touch-icon.png"}
						/>
					</div>
				)}
			</div>
			<div className="menu-item-content flex min-w-0 flex-1 flex-col gap-2 p-3 sm:p-4">
				<p className="font-semibold leading-tight">{item.title}</p>
				{!menuOnly && Number(item.ratingCount) > 0 && (
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
						{showFromPrice && (
							<span className="block text-[11px] text-muted-foreground">{t("store.product.from")}</span>
						)}
						{isPromotional && (
							<span className="block text-muted-foreground text-xs line-through">
								{money.format(displayedUnitPrice(Number(item.regularPriceCents), productFees) / 100)}
							</span>
						)}
						<span className={cn("block font-bold text-lg", isPromotional && "text-primary")}>{displayPrice}</span>
						<ProductFeeSummary priceCents={Number(item.fromPriceCents)} fees={productFees} className="text-muted-foreground" />
					</div>
					{!menuOnly && item.cashbackPercent != null && (
						<Badge tone="accent">{item.cashbackPercent}%</Badge>
					)}
					{onSelect && (
						<span
							aria-hidden
							className="ml-auto grid size-10 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground shadow-md transition-transform group-hover:scale-105"
						>
							{menuOnly ? <LuEye className="size-5" /> : <LuPlus className="size-5" />}
						</span>
					)}
				</div>
			</div>
		</Card>
	);
}
