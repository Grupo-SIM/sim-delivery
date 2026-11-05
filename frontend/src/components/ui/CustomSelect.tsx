import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { LuChevronDown, LuSearch } from "react-icons/lu";
import { useDebouncedInput } from "@/hooks/use-debounced-input";
import { cn } from "@/lib/utils";
import { ScrollArea } from "./ScrollArea";

export interface SelectOption {
	fontFamily?: string;
	imageUrl?: string;
	label: string;
	value: string;
}

export interface SelectGroup {
	label: string;
	options: SelectOption[];
}

interface CustomSelectProps {
	ariaLabel?: string;
	className?: string;
	disabled?: boolean;
	groups?: SelectGroup[];
	onChange: (value: string) => void;
	options?: SelectOption[];
	placeholder?: string;
	/** Shows a search box that filters options by label (accent/case-insensitive). */
	searchPlaceholder?: string;
	searchable?: boolean;
	value: string;
}

interface DropdownPos {
	left: number;
	top: number;
	width: number;
}

function normalize(text: string) {
	return text.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
}

export function CustomSelect({
	ariaLabel,
	className,
	disabled = false,
	groups,
	onChange,
	options,
	placeholder = "—",
	searchPlaceholder = "Buscar...",
	searchable = false,
	value,
}: CustomSelectProps) {
	const [open, setOpen] = useState(false);
	const [pos, setPos] = useState<DropdownPos>({ left: 0, top: 0, width: 0 });
	const triggerRef = useRef<HTMLButtonElement>(null);
	const dropdownRef = useRef<HTMLDivElement>(null);
	const [query, setQuery] = useState("");
	const [localQuery, setLocalQuery] = useDebouncedInput(query, setQuery, 150);

	const allOptions: SelectOption[] = groups ? groups.flatMap(g => g.options) : (options ?? []);
	const selected = allOptions.find(o => o.value === value);

	const normalizedQuery = normalize(query);
	const matches = (option: SelectOption) => !normalizedQuery || normalize(option.label).includes(normalizedQuery);
	const visibleOptions = options?.filter(matches);
	const visibleGroups = groups
		?.map(group => ({ ...group, options: group.options.filter(matches) }))
		.filter(group => group.options.length > 0);
	const isEmpty = (visibleGroups ?? visibleOptions ?? []).length === 0;

	function toggleDropdown() {
		if (open) {
			setOpen(false);
			return;
		}

		if (!triggerRef.current) return;
		const rect = triggerRef.current.getBoundingClientRect();
		setPos({ left: rect.left, top: rect.bottom + 4, width: rect.width });
		setQuery("");
		setLocalQuery("");
		setOpen(true);
	}

	function select(v: string) {
		onChange(v);
		setOpen(false);
	}

	useEffect(() => {
		if (!open) return;

		function handleClick(e: MouseEvent) {
			if (
				!triggerRef.current?.contains(e.target as Node) &&
				!dropdownRef.current?.contains(e.target as Node)
			) {
				setOpen(false);
			}
		}

		function handleKey(e: KeyboardEvent) {
			if (e.key === "Escape") setOpen(false);
		}

		document.addEventListener("mousedown", handleClick);
		document.addEventListener("keydown", handleKey);
		return () => {
			document.removeEventListener("mousedown", handleClick);
			document.removeEventListener("keydown", handleKey);
		};
	}, [open]);

	useEffect(() => {
		if (disabled) setOpen(false);
	}, [disabled]);

	return (
		<>
			<button
				aria-expanded={open}
				aria-haspopup="listbox"
				aria-label={ariaLabel}
				className={cn(
					"flex h-11 w-full cursor-pointer items-center justify-between rounded-md border border-border bg-surface px-3 text-card-foreground text-sm transition-[border-color,box-shadow] duration-300",
					"hover:border-foreground/40 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1",
					"disabled:cursor-not-allowed disabled:border-border disabled:bg-muted disabled:text-muted-foreground disabled:opacity-70 disabled:hover:border-border",
					className,
				)}
				disabled={disabled}
				onClick={toggleDropdown}
				ref={triggerRef}
				type="button"
			>
				<span className={cn("flex min-w-0 items-center gap-2", !selected && "text-muted-foreground")}>
					{selected?.imageUrl && (
						<img alt="" className="size-7 shrink-0 rounded object-cover" src={selected.imageUrl} />
					)}
					<span className="truncate" style={{ fontFamily: selected?.fontFamily }}>{selected?.label ?? placeholder}</span>
				</span>
				<LuChevronDown
					className={cn(
						"ml-2 h-4 w-4 shrink-0 text-muted-foreground transition-transform",
						open && "rotate-180",
					)}
				/>
			</button>

			{open &&
				createPortal(
					<ScrollArea
						className="max-h-[260px] overflow-y-auto overflow-x-hidden rounded-md border border-border bg-popover text-popover-foreground shadow-medium"
						onMouseDown={event => {
							if (!(event.target instanceof HTMLInputElement)) event.preventDefault();
							event.stopPropagation();
						}}
						// Keep wheel/touch scrolling working inside modals that lock outside scroll.
						onTouchMove={event => event.stopPropagation()}
						onWheel={event => event.stopPropagation()}
						ref={dropdownRef}
						role="listbox"
						style={{
							left: pos.left,
							pointerEvents: "auto",
							position: "fixed",
							top: pos.top,
							width: pos.width,
							zIndex: 9999,
						}}
					>
						{searchable && (
							<div className="sticky top-0 z-10 border-border border-b bg-popover p-2">
								<div className="relative">
									<LuSearch aria-hidden className="-translate-y-1/2 absolute top-1/2 left-2.5 size-4 text-muted-foreground" />
									<input
										autoFocus
										className="h-9 w-full rounded-md border border-border bg-surface pr-3 pl-8 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
										name="select-search"
										onChange={event => setLocalQuery(event.currentTarget.value)}
										placeholder={searchPlaceholder}
										type="text"
										value={localQuery}
									/>
								</div>
							</div>
						)}
						{isEmpty && searchable && (
							<p className="px-3 py-2 text-muted-foreground text-sm">—</p>
						)}
						{visibleGroups
							? visibleGroups.map(group => (
									<div key={group.label}>
										<p className="px-3 py-1.5 font-semibold text-muted-foreground text-xs">{group.label}</p>
										{group.options.map(opt => (
											<button
												className={cn(
													"w-full cursor-pointer px-3 py-2 text-left text-sm hover:bg-muted",
													opt.value === value && "bg-primary font-medium text-primary-foreground hover:bg-primary/90",
												)}
												key={opt.value}
												onClick={() => select(opt.value)}
												role="option"
												type="button"
											>
												<span className="flex items-center gap-2">
													{opt.imageUrl && (
														<img alt="" className="size-8 shrink-0 rounded object-cover" src={opt.imageUrl} />
													)}
													<span className="truncate" style={{ fontFamily: opt.fontFamily }}>{opt.label}</span>
												</span>
											</button>
										))}
									</div>
								))
							: visibleOptions?.map(opt => (
									<button
										className={cn(
											"w-full cursor-pointer px-3 py-2 text-left text-sm hover:bg-muted",
											opt.value === value && "bg-primary font-medium text-primary-foreground hover:bg-primary/90",
										)}
										key={opt.value}
										onClick={() => select(opt.value)}
										role="option"
										type="button"
									>
										<span className="flex items-center gap-2">
											{opt.imageUrl && (
												<img alt="" className="size-8 shrink-0 rounded object-cover" src={opt.imageUrl} />
											)}
											<span className="truncate" style={{ fontFamily: opt.fontFamily }}>{opt.label}</span>
										</span>
									</button>
								))}
					</ScrollArea>,
					document.body,
				)}
		</>
	);
}
