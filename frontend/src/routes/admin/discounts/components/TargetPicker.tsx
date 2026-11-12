import { Checkbox } from "@/components/ui/Checkbox";
import { ScrollArea } from "@/components/ui/ScrollArea";

interface TargetPickerProps {
	emptyLabel: string;
	label: string;
	onChange: (ids: string[]) => void;
	options: { id: string; label: string }[];
	selected: string[];
}

/** Checkbox list used to pick discount targets; an empty selection means "all". */
export function TargetPicker({ emptyLabel, label, onChange, options, selected }: TargetPickerProps) {
	function toggle(id: string) {
		onChange(selected.includes(id) ? selected.filter(item => item !== id) : [...selected, id]);
	}

	return (
		<div className="grid content-start gap-2 font-medium text-sm">
			<span>{label}</span>
			<ScrollArea className="max-h-40 rounded-md border border-input">
				<div className="grid gap-1 p-2">
					{options.length === 0 && <p className="text-muted-foreground">{emptyLabel}</p>}
					{options.map(option => (
						<label className="flex cursor-pointer items-center gap-2 font-normal" key={option.id}>
							<Checkbox checked={selected.includes(option.id)} onChange={() => toggle(option.id)} />
							<span>{option.label}</span>
						</label>
					))}
				</div>
			</ScrollArea>
			<p className="font-normal text-muted-foreground text-xs">
				{selected.length === 0 ? emptyLabel : selected.length}
			</p>
		</div>
	);
}
