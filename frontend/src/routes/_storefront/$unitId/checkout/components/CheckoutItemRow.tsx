import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { LuMinus, LuPencil, LuPlus, LuTrash2 } from "react-icons/lu";
import { Button } from "@/components/ui/button";
import { useDebouncedInput } from "@/hooks/use-debounced-input";
import { formatMoney } from "@/lib/formatMoney";
import { type CartItem, useCartStore } from "@/stores";

interface CheckoutItemRowProps {
	item: CartItem;
	onEdit: (item: CartItem) => void;
}

export function CheckoutItemRow({ item, onEdit }: CheckoutItemRowProps) {
	const { t } = useTranslation();
	const setQuantity = useCartStore(state => state.setQuantity);
	const saveNote = useCartStore(state => state.setNote);
	const [note, setNoteState] = useState(item.note);
	const noteRef = useRef<HTMLTextAreaElement>(null);
	const manuallyResized = useRef(false);
	const automaticHeight = useRef<number | null>(null);
	const [localNote, setLocalNote, flushNote] = useDebouncedInput(note, value => {
		setNoteState(value);
		saveNote(item.lineKey, value);
	});

	useEffect(() => {
		setNoteState(item.note);
		setLocalNote(item.note);
	}, [item.note, setLocalNote]);

	useLayoutEffect(() => {
		const textarea = noteRef.current;
		if (!textarea || manuallyResized.current) return;
		const style = getComputedStyle(textarea);
		const lineHeight = Number.parseFloat(style.lineHeight) || 20;
		const maxHeight =
			lineHeight * 4 + Number.parseFloat(style.paddingTop) + Number.parseFloat(style.paddingBottom);
		textarea.style.height = "auto";
		textarea.style.height = `${Math.min(textarea.scrollHeight, maxHeight)}px`;
		automaticHeight.current = textarea.offsetHeight;
	}, []);

	useEffect(() => {
		const textarea = noteRef.current;
		if (!textarea) return;
		automaticHeight.current = textarea.offsetHeight;
		const observer = new ResizeObserver(() => {
			if (automaticHeight.current !== textarea.offsetHeight) manuallyResized.current = true;
		});
		observer.observe(textarea);
		return () => observer.disconnect();
	}, []);

	return (
		<article className="border-border/70 border-b py-4 last:border-b-0">
			<div className="grid grid-cols-[5rem_minmax(0,1fr)_auto] gap-x-3">
				<div className="relative size-20">
					{item.imageUrl ? (
						<img
							alt=""
							className="size-20 rounded-lg object-cover"
							loading="lazy"
							src={item.imageUrl}
						/>
					) : (
						<div aria-hidden className="size-20 rounded-lg bg-muted" />
					)}
					<Button
						aria-label={t("store.checkout.order.editItem")}
						className="absolute -right-2 -bottom-2 rounded-full border-primary/30 bg-primary text-primary-foreground shadow-md hover:bg-primary/90"
						onClick={() => onEdit(item)}
						size="icon"
						type="button"
						variant="outline"
					>
						<LuPencil />
					</Button>
				</div>
				<div className="min-w-0">
					<p className="font-semibold text-sm leading-5">{item.title}</p>
					{item.options.length > 0 && (
						<p className="mt-1 text-muted-foreground text-xs leading-4">
							{item.options
								.map(
									option =>
										`${option.groupName}: ${option.quantity > 1 ? `${option.quantity}× ` : ""}${option.optionName}`,
								)
								.join(" · ")}
						</p>
					)}
				</div>
				<div className="flex min-w-18 flex-col items-end gap-2">
					<span className="whitespace-nowrap font-semibold text-sm">
						{formatMoney((item.priceCents * item.quantity) / 100)}
					</span>
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
			<textarea
				className="mt-3 min-h-0 w-full resize-y rounded-md border border-input bg-surface px-3 py-2 text-sm placeholder:text-muted-foreground/70 focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
				onBlur={flushNote}
				onChange={event => setLocalNote(event.currentTarget.value)}
				placeholder={t("store.checkout.order.itemNotePlaceholder")}
				ref={noteRef}
				rows={2}
				value={localNote}
			/>
		</article>
	);
}
