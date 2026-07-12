import { useEffect, useRef } from "react";

interface HueSliderProps {
	hue: number;
	onChange: (hue: number) => void;
}

export function HueSlider({ hue, onChange }: HueSliderProps) {
	const trackRef = useRef<HTMLDivElement>(null);
	const draggingRef = useRef(false);
	const onChangeRef = useRef(onChange);
	onChangeRef.current = onChange;

	function updateFromEvent(clientX: number) {
		const track = trackRef.current;
		if (!track) return;
		const rect = track.getBoundingClientRect();
		const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
		onChangeRef.current(ratio * 360);
	}

	// biome-ignore lint/correctness/useExhaustiveDependencies: updateFromEvent reads live refs only, safe with empty deps
	useEffect(() => {
		function handleMove(e: PointerEvent) {
			if (!draggingRef.current) return;
			updateFromEvent(e.clientX);
		}

		function handleUp() {
			draggingRef.current = false;
		}

		document.addEventListener("pointermove", handleMove);
		document.addEventListener("pointerup", handleUp);
		return () => {
			document.removeEventListener("pointermove", handleMove);
			document.removeEventListener("pointerup", handleUp);
		};
	}, []);

	return (
		<div
			className="relative h-3 w-full cursor-pointer rounded-pill"
			onPointerDown={event => {
				draggingRef.current = true;
				updateFromEvent(event.clientX);
			}}
			ref={trackRef}
			style={{
				background: "linear-gradient(to right, #f00, #ff0, #0f0, #0ff, #00f, #f0f, #f00)",
			}}
		>
			<div
				aria-hidden
				className="absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-medium"
				style={{ backgroundColor: `hsl(${hue}, 100%, 50%)`, left: `${(hue / 360) * 100}%` }}
			/>
		</div>
	);
}
