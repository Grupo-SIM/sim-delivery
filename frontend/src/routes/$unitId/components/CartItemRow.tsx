import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { useDebouncedInput } from "@/hooks/use-debounced-input";
import { type CartItem, useCartStore } from "@/stores";
import { money } from "./types";

interface CartItemRowProps {
	item: CartItem;
}

export function CartItemRow({ item }: CartItemRowProps) {
	const { t } = useTranslation();
	const setQuantity = useCartStore(state => state.setQuantity);
	const setNote = useCartStore(state => state.setNote);
	const removeItem = useCartStore(state => state.removeItem);

	const [note, setNoteState] = useState(item.note);
	const [localNote, setLocalNote, flushNote] = useDebouncedInput(note, value => {
		setNoteState(value);
		setNote(item.lineKey, value);
	});

	return (
		<div className="flex gap-3 border-border/60 border-b py-3 last:border-0">
			<img
				alt={item.title}
				className="size-14 shrink-0 rounded-md object-cover"
				loading="lazy"
				src={item.imageUrl}
			/>
			<div className="flex min-w-0 flex-1 flex-col gap-2">
				<div className="flex items-start justify-between gap-2">
					<p className="truncate font-medium">{item.title}</p>
					<span className="shrink-0 font-semibold text-sm">
						{money.format((item.priceCents * item.quantity) / 100)}
					</span>
				</div>

				{item.options.length > 0 && (
					<ul className="space-y-0.5 text-muted-foreground text-xs">
						{item.options.map(opt => (
							<li key={opt.optionId}>
								{opt.groupName}: {opt.quantity > 1 ? `${opt.quantity}x ` : ""}{opt.optionName}
							</li>
						))}
					</ul>
				)}

				<textarea
					className="min-h-9 w-full rounded border border-input bg-surface px-2 py-1 text-sm placeholder:text-muted-foreground focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
					onBlur={flushNote}
					onChange={event => setLocalNote(event.currentTarget.value)}
					placeholder={t("store.cart.notePlaceholder")}
					value={localNote}
				/>

				<div className="flex items-center gap-2">
					<Button
						onClick={() => setQuantity(item.lineKey, item.quantity - 1)}
						size="sm"
						type="button"
						variant="outline"
					>
						−
					</Button>
					<span className="min-w-6 text-center text-sm">{item.quantity}</span>
					<Button
						onClick={() => setQuantity(item.lineKey, item.quantity + 1)}
						size="sm"
						type="button"
						variant="outline"
					>
						+
					</Button>
					<Button
						className="ml-auto"
						onClick={() => removeItem(item.lineKey)}
						size="sm"
						type="button"
						variant="outline"
					>
						{t("store.cart.remove")}
					</Button>
				</div>
			</div>
		</div>
	);
}
