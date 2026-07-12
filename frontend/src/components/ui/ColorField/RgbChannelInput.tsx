import { Input } from "@/components/ui/input";
import { useDebouncedInput } from "@/hooks/use-debounced-input";

interface RgbChannelInputProps {
	label: string;
	onChange: (value: number) => void;
	value: number;
}

function clamp(n: number) {
	return Math.min(255, Math.max(0, n));
}

export function RgbChannelInput({ label, onChange, value }: RgbChannelInputProps) {
	const [local, setLocal, flush] = useDebouncedInput(String(value), raw => {
		const parsed = Number.parseInt(raw, 10);
		onChange(clamp(Number.isNaN(parsed) ? 0 : parsed));
	});

	const inputId = `rgb-channel-${label.toLowerCase()}`;

	return (
		<div className="flex flex-1 flex-col gap-1">
			<label className="text-center text-muted-foreground text-xs uppercase" htmlFor={inputId}>
				{label}
			</label>
			<Input
				className="px-1 text-center"
				id={inputId}
				inputMode="numeric"
				onBlur={flush}
				onChange={event => setLocal(event.currentTarget.value.replace(/\D/g, "").slice(0, 3))}
				placeholder="0"
				value={local}
			/>
		</div>
	);
}
