import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/Checkbox";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/Modal";
import { ScrollArea } from "@/components/ui/ScrollArea";
import { useDebouncedInput } from "@/hooks/use-debounced-input";

interface TargetPickerProps {
	/** Label of the "select everything" option, also shown on the trigger when it applies. */
	allLabel: string;
	/** Shown on the trigger while nothing is selected and an empty selection does not mean "all". */
	emptyLabel: string;
	/** When true an empty selection means "all" (units); otherwise it means "none". */
	emptyMeansAll?: boolean;
	/** Stable key identifying this picker in the modal URL. */
	kind: string;
	label: string;
	noOptionsLabel: string;
	onChange: (ids: string[]) => void;
	options: { id: string; label: string }[];
	searchPlaceholder: string;
	selected: string[];
}

/** Trigger + modal (search, checkbox list, Descartar/Confirmar) used to pick discount targets. */
export function TargetPicker({
	allLabel,
	emptyLabel,
	emptyMeansAll = false,
	kind,
	label,
	noOptionsLabel,
	onChange,
	options,
	searchPlaceholder,
	selected,
}: TargetPickerProps) {
	const { t } = useTranslation();
	const [isOpen, setIsOpen] = useState(false);
	const [draft, setDraft] = useState<string[]>([]);
	const [search, setSearch] = useState("");
	const [localSearch, setLocalSearch] = useDebouncedInput(search, setSearch);
	const filtered = useMemo(() => {
		const query = search.trim().toLocaleLowerCase();
		return query ? options.filter(option => option.label.toLocaleLowerCase().includes(query)) : options;
	}, [options, search]);

	function open() {
		setDraft(selected);
		setSearch("");
		setIsOpen(true);
	}

	function toggle(id: string) {
		setDraft(ids => (ids.includes(id) ? ids.filter(item => item !== id) : [...ids, id]));
	}

	const allSelected = emptyMeansAll
		? draft.length === 0
		: options.length > 0 && draft.length === options.length;

	function toggleAll() {
		setDraft(emptyMeansAll || allSelected ? [] : options.map(option => option.id));
	}

	const triggerLabel =
		selected.length === 0
			? emptyMeansAll
				? allLabel
				: emptyLabel
			: !emptyMeansAll && selected.length === options.length
				? allLabel
				: t("admin.discounts.picker.selected", { count: selected.length });

	function confirm() {
		onChange(draft);
		setIsOpen(false);
	}

	return (
		<div className="grid content-start gap-2 font-medium text-sm">
			<span>{label}</span>
			<Button
				className="w-full justify-between font-normal"
				onClick={open}
				type="button"
				variant="outline"
			>
				<span className="truncate">{triggerLabel}</span>
			</Button>
			<Modal
				isOpen={isOpen}
				layer="submodal"
				maxWidth="640px"
				onClose={() => setIsOpen(false)}
				title={label}
				urlKey={`discount-targets-${kind}`}
			>
				<div className="space-y-4">
					<Badge tone="neutral">{t("admin.discounts.picker.selected", { count: draft.length })}</Badge>
					<Input
						name={`discount-${kind}-search`}
						onChange={event => setLocalSearch(event.currentTarget.value)}
						placeholder={searchPlaceholder}
						value={localSearch}
					/>
					<ScrollArea className="max-h-72 overflow-y-auto">
						{options.length > 0 && (
							<label className="flex cursor-pointer items-center gap-2 rounded-md border border-transparent p-2 font-medium text-sm hover:border-border hover:bg-muted/40">
								<Checkbox checked={allSelected} onChange={toggleAll} />
								<span className="min-w-0 flex-1 truncate">{allLabel}</span>
							</label>
						)}
						{filtered.map(option => (
							<label
								className="flex cursor-pointer items-center gap-2 rounded-md border border-transparent p-2 font-normal text-sm hover:border-border hover:bg-muted/40"
								key={option.id}
							>
								<Checkbox checked={draft.includes(option.id)} onChange={() => toggle(option.id)} />
								<span className="min-w-0 flex-1 truncate">{option.label}</span>
							</label>
						))}
						{filtered.length === 0 && (
							<p className="py-6 text-center text-muted-foreground text-sm">
								{options.length === 0 ? noOptionsLabel : t("admin.discounts.picker.empty")}
							</p>
						)}
					</ScrollArea>
					<div className="flex justify-end gap-2 border-border border-t pt-4">
						<Button onClick={() => setIsOpen(false)} type="button" variant="outline">
							{t("admin.discounts.picker.discard")}
						</Button>
						<Button onClick={confirm} type="button">
							{t("admin.discounts.picker.confirm")}
						</Button>
					</div>
				</div>
			</Modal>
		</div>
	);
}
