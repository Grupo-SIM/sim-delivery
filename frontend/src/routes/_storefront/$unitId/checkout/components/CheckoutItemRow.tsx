import { useEffect, useState } from "react";
import { LuMinus, LuPlus, LuTrash2 } from "react-icons/lu";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { useDebouncedInput } from "@/hooks/use-debounced-input";
import { type CartItem, useCartStore } from "@/stores";
import { formatMoney } from "@/lib/formatMoney";

interface CheckoutItemRowProps {
	item: CartItem;
}

export function CheckoutItemRow({ item }: CheckoutItemRowProps) {
	const { t } = useTranslation();
	const setQuantity = useCartStore(state => state.setQuantity);
	const saveNote = useCartStore(state => state.setNote);
	const [note, setNoteState] = useState(item.note);
	const [localNote, setLocalNote, flushNote] = useDebouncedInput(note, value => {
		setNoteState(value);
		saveNote(item.lineKey, value);
	});

	useEffect(() => {
		setNoteState(item.note);
		setLocalNote(item.note);
	}, [item.note, setLocalNote]);

	return (
		<article className="flex gap-3 border-border/70 border-b py-4 last:border-b-0">
			{item.imageUrl ? (
				<img alt={item.title} className="size-20 shrink-0 rounded-lg object-cover" loading="lazy" src={item.imageUrl} />
			) : (
				<div aria-hidden className="size-20 shrink-0 rounded-lg bg-muted" />
			)}
			<div className="min-w-0 flex-1 space-y-2">
				<div className="flex items-start justify-between gap-3">
					<div className="min-w-0">
						<p className="font-semibold text-sm leading-5">{item.title}</p>
						{item.options.length > 0 && (
							<p className="mt-1 text-muted-foreground text-xs leading-4">
								{item.options
									.map(option => `${option.groupName}: ${option.quantity > 1 ? `${option.quantity}× ` : ""}${option.optionName}`)
									.join(" · ")}
							</p>
						)}
					</div>
					<span className="shrink-0 font-semibold text-sm">{formatMoney((item.priceCents * item.quantity) / 100)}</span>
				</div>
				<textarea
					className="min-h-9 w-full resize-none rounded-md border border-input bg-surface px-2 py-1.5 text-sm placeholder:text-muted-foreground/70 focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
					onBlur={flushNote}
					onChange={event => setLocalNote(event.currentTarget.value)}
					placeholder={t("store.checkout.order.itemNotePlaceholder")}
					rows={1}
					value={localNote}
				/>
				<div className="flex items-center justify-end">
					<div className="flex items-center overflow-hidden rounded-md border border-border bg-muted/30">
						<Button
							aria-label={item.quantity === 1 ? "Excluir item" : "Diminuir quantidade"}
							onClick={() => setQuantity(item.lineKey, item.quantity - 1)}
							size="icon"
							type="button"
							variant="outline"
						>
							{item.quantity === 1 ? <LuTrash2 /> : <LuMinus />}
						</Button>
						<span className="w-9 text-center font-semibold text-sm">{item.quantity}</span>
						<Button
							aria-label="Aumentar quantidade"
							onClick={() => setQuantity(item.lineKey, item.quantity + 1)}
							size="icon"
							type="button"
							variant="outline"
						>
							<LuPlus />
						</Button>
					</div>
				</div>
			</div>
		</article>
	);
}
