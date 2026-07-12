import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Input } from "@/components/ui/input";
import { useDebouncedInput } from "@/hooks/use-debounced-input";
import { hexToHsv, hexToRgb, hsvToHex, isValidHex, rgbToHex } from "./color-utils";
import { HueSlider } from "./HueSlider";
import { RgbInputs } from "./RgbInputs";
import { SaturationPanel } from "./SaturationPanel";
import type { HSV } from "./types";

interface ColorFieldProps {
	value: string;
	onChange: (value: string) => void;
}

interface PopoverPos {
	left: number;
	top: number;
}

/** Custom hue/saturation color picker, paired with a hex text input. Both edit the same "#rrggbb" value. */
export function ColorField({ onChange, value }: ColorFieldProps) {
	const [localValue, setLocalValue, flushLocalValue] = useDebouncedInput(value, onChange);
	const swatch = isValidHex(localValue) ? localValue : "#000000";

	const [open, setOpen] = useState(false);
	const [pos, setPos] = useState<PopoverPos>({ left: 0, top: 0 });
	const [hsv, setHsv] = useState<HSV>(() => hexToHsv(swatch));
	const triggerRef = useRef<HTMLButtonElement>(null);
	const popoverRef = useRef<HTMLDivElement>(null);

	function openPopover() {
		if (!triggerRef.current) return;
		const rect = triggerRef.current.getBoundingClientRect();
		setPos({ left: rect.left, top: rect.bottom + 12 });
		setHsv(hexToHsv(swatch));
		setOpen(true);
	}

	function updateHsv(next: HSV) {
		setHsv(next);
		const hex = hsvToHex(next);
		setLocalValue(hex);
		onChange(hex);
	}

	useEffect(() => {
		if (!open) return;

		function handleClick(e: MouseEvent) {
			if (
				!triggerRef.current?.contains(e.target as Node) &&
				!popoverRef.current?.contains(e.target as Node)
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

	return (
		<div className="flex items-center gap-2">
			<button
				aria-expanded={open}
				aria-haspopup="dialog"
				aria-label="color"
				className="h-9 w-9 shrink-0 rounded-md border border-border transition-[border-color,box-shadow] duration-300 hover:border-foreground/40 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1"
				onClick={openPopover}
				ref={triggerRef}
				style={{ backgroundColor: swatch }}
				type="button"
			/>
			<Input
				className="w-28"
				onBlur={flushLocalValue}
				onChange={event => setLocalValue(event.currentTarget.value)}
				placeholder="#22c55e"
				value={localValue}
			/>

			{open &&
				createPortal(
					<div
						className="w-56 overflow-hidden rounded-brand border border-border bg-popover shadow-medium"
						ref={popoverRef}
						role="dialog"
						style={{ left: pos.left, position: "fixed", top: pos.top, zIndex: 9999 }}
					>
						<SaturationPanel
							color={hsvToHex(hsv)}
							hue={hsv.h}
							onChange={(s, v) => updateHsv({ ...hsv, s, v })}
							s={hsv.s}
							v={hsv.v}
						/>
						<div className="flex flex-col gap-3 p-3">
							<HueSlider hue={hsv.h} onChange={h => updateHsv({ ...hsv, h })} />
							<RgbInputs onChange={rgb => updateHsv(hexToHsv(rgbToHex(rgb)))} rgb={hexToRgb(hsvToHex(hsv))} />
						</div>
					</div>,
					document.body,
				)}
		</div>
	);
}
