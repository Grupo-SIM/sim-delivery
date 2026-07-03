import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { type MenuItem, money } from "./types";

interface MenuItemCardProps {
	item: MenuItem;
}

export function MenuItemCard({ item }: MenuItemCardProps) {
	return (
		<Card className="flex gap-3 overflow-hidden p-3">
			<img
				alt={item.title}
				className="size-20 shrink-0 rounded-md object-cover"
				loading="lazy"
				src={item.imageUrl}
			/>
			<div className="flex min-w-0 flex-1 flex-col gap-1">
				<p className="truncate font-medium">{item.title}</p>
				{item.description && <p className="line-clamp-2 text-muted-foreground text-sm">{item.description}</p>}
				<div className="mt-auto flex items-center gap-2 pt-1">
					<span className="font-semibold">{money.format(Number(item.priceCents) / 100)}</span>
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
