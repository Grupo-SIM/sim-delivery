import { RgbChannelInput } from "./RgbChannelInput";
import type { RGB } from "./types";

interface RgbInputsProps {
	onChange: (rgb: RGB) => void;
	rgb: RGB;
}

export function RgbInputs({ onChange, rgb }: RgbInputsProps) {
	return (
		<div className="flex gap-2">
			<RgbChannelInput label="R" onChange={r => onChange({ ...rgb, r })} value={rgb.r} />
			<RgbChannelInput label="G" onChange={g => onChange({ ...rgb, g })} value={rgb.g} />
			<RgbChannelInput label="B" onChange={b => onChange({ ...rgb, b })} value={rgb.b} />
		</div>
	);
}
