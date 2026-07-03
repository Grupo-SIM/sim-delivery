import { Input } from "@/components/ui/input";
import { useDebouncedInput } from "@/hooks/use-debounced-input";

interface ColorFieldProps {
	value: string;
	onChange: (value: string) => void;
}

/** Paired swatch + hex text input, kept in sync. Both edit the same "#rrggbb" value. */
export function ColorField({ onChange, value }: ColorFieldProps) {
	const [localValue, setLocalValue, flushLocalValue] = useDebouncedInput(value, onChange);
	const swatch = /^#[0-9a-fA-F]{6}$/.test(localValue) ? localValue : "#000000";

	return (
		<div className="flex items-center gap-2">
			<input
				aria-label="color"
				className="h-9 w-9 shrink-0 cursor-pointer rounded-md border border-border bg-transparent p-1"
				onChange={event => onChange(event.currentTarget.value)}
				type="color"
				value={swatch}
			/>
			<Input
				className="w-28"
				onBlur={flushLocalValue}
				onChange={event => setLocalValue(event.currentTarget.value)}
				placeholder="#22c55e"
				value={localValue}
			/>
		</div>
	);
}
