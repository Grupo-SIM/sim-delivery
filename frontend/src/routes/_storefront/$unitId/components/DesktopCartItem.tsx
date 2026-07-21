import { LuMinus, LuPlus, LuTrash2 } from "react-icons/lu";
import { Button } from "@/components/ui/button";
import { type CartItem, useCartStore } from "@/stores";
import { money } from "./types";

interface DesktopCartItemProps {
	item: CartItem;
}

export function DesktopCartItem({ item }: DesktopCartItemProps) {
	const setQuantity = useCartStore(state => state.setQuantity);
	const removeItem = useCartStore(state => state.removeItem);

	return (
		<div className="flex gap-3 py-4">
			{item.imageUrl && (
				<img alt={item.title} className="size-12 shrink-0 rounded-lg object-cover" loading="lazy" src={item.imageUrl} />
			)}
			<div className="min-w-0 flex-1">
				<div className="flex gap-2">
					<div className="min-w-0 flex-1">
						<p className="truncate font-semibold text-sm">{item.title}</p>
						<p className="text-muted-foreground text-sm">{money.format(item.priceCents / 100)}</p>
					</div>
					<Button
						aria-label={`Remover ${item.title}`}
						className="size-7 shrink-0 text-muted-foreground"
						onClick={() => removeItem(item.lineKey)}
						size="icon"
						type="button"
						variant="outline"
					>
						<LuTrash2 className="size-3.5" />
					</Button>
				</div>
				{item.options.length > 0 && (
					<p className="mt-1 truncate text-muted-foreground text-xs">
						{item.options.map(option => option.optionName).join(", ")}
					</p>
				)}
				<div className="mt-2 flex items-center justify-end gap-1.5">
					<Button
						aria-label={`Diminuir ${item.title}`}
						className="size-6"
						onClick={() => setQuantity(item.lineKey, item.quantity - 1)}
						size="icon"
						type="button"
						variant="outline"
					>
						<LuMinus className="size-3" />
					</Button>
					<span className="min-w-5 text-center font-medium text-sm">{item.quantity}</span>
					<Button
						aria-label={`Aumentar ${item.title}`}
						className="size-6"
						onClick={() => setQuantity(item.lineKey, item.quantity + 1)}
						size="icon"
						type="button"
						variant="outline"
					>
						<LuPlus className="size-3" />
					</Button>
				</div>
			</div>
		</div>
	);
}
