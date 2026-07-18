import { useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { LuPlus } from "react-icons/lu";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { useCartStore } from "@/stores";
import { type MenuItem, money } from "./types";

interface MenuItemCardProps {
	item: MenuItem;
	unitId: string;
	unitSlug: string;
}

export function MenuItemCard({ item, unitId, unitSlug }: MenuItemCardProps) {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const addItem = useCartStore(state => state.addItem);
	const hasGroups = item.optionGroups.length > 0;

	const displayPrice = hasGroups
		? `${t("store.product.from")} ${money.format(Number(item.fromPriceCents) / 100)}`
		: money.format(Number(item.priceCents) / 100);

	function handleAdd() {
		if (hasGroups) {
			void navigate({
				params: { productId: item.productSlug, unitId: unitSlug },
				to: "/$unitId/product/$productId",
			});
		} else {
			addItem(unitId, {
				id: item.id,
				imageUrl: item.imageUrl,
				options: [],
				priceCents: Number(item.priceCents),
				productId: item.productId,
				title: item.title,
			});
		}
	}

	return (
<<<<<<< Updated upstream
		<Card className="flex gap-3 overflow-hidden p-3">
			{item.imageUrl && (
				<img
					alt={item.title}
					className="size-20 shrink-0 rounded-md object-cover"
					loading="lazy"
					src={item.imageUrl}
				/>
			)}
			<div className="flex min-w-0 flex-1 flex-col gap-1">
				<p className="truncate font-medium">{item.title}</p>
				{item.description && <p className="line-clamp-2 text-muted-foreground text-sm">{item.description}</p>}
				<div className="mt-auto flex items-center gap-2 pt-1">
=======
		<Card className="flex gap-3 overflow-hidden p-3 xl:block xl:p-0 xl:pb-3">
			{item.imageUrl && (
				<div className="relative shrink-0 xl:w-full">
					<img
						alt={item.title}
						className="size-20 rounded-md object-cover xl:h-32 xl:w-full xl:rounded-none"
						loading="lazy"
						src={item.imageUrl}
					/>
					<button
						aria-label={t("store.cart.add")}
						className="absolute right-2 bottom-2 flex size-8 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-soft transition-transform active:scale-90"
						onClick={handleAdd}
						type="button"
					>
						<LuPlus className="size-4" />
					</button>
				</div>
			)}
			<div className="flex min-w-0 flex-1 flex-col gap-1 xl:mt-2 xl:px-3">
				<p className="truncate font-medium">{item.title}</p>
				{item.description && (
					<p className="line-clamp-2 text-muted-foreground text-sm xl:hidden">{item.description}</p>
				)}
				<div className="mt-auto flex items-center gap-2 pt-1 xl:pt-0">
>>>>>>> Stashed changes
					<span className="font-semibold">{displayPrice}</span>
					{item.cashbackPercent != null && (
						<Badge className="border-green-500/30 bg-green-500/10 text-green-500">
							{item.cashbackPercent}%
						</Badge>
					)}
<<<<<<< Updated upstream
					<Button className="ml-auto" onClick={handleAdd} size="sm" type="button">
						{t("store.cart.add")}
					</Button>
=======
					{!item.imageUrl && (
						<button
							aria-label={t("store.cart.add")}
							className="ml-auto flex size-8 items-center justify-center rounded-full bg-primary text-primary-foreground"
							onClick={handleAdd}
							type="button"
						>
							<LuPlus className="size-4" />
						</button>
					)}
>>>>>>> Stashed changes
				</div>
			</div>
		</Card>
	);
}
