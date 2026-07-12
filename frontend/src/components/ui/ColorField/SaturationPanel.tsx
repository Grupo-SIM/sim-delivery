import { useEffect, useRef } from "react";

interface SaturationPanelProps {
	color: string;
	hue: number;
	onChange: (s: number, v: number) => void;
	s: number;
	v: number;
}

export function SaturationPanel({ color, hue, onChange, s, v }: SaturationPanelProps) {
	const panelRef = useRef<HTMLDivElement>(null);
	const draggingRef = useRef(false);
	const onChangeRef = useRef(onChange);
	onChangeRef.current = onChange;

	function updateFromEvent(clientX: number, clientY: number) {
		const panel = panelRef.current;
		if (!panel) return;
		const rect = panel.getBoundingClientRect();
		const nextS = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
		const nextV = 1 - Math.min(1, Math.max(0, (clientY - rect.top) / rect.height));
		onChangeRef.current(nextS, nextV);
	}

	// biome-ignore lint/correctness/useExhaustiveDependencies: updateFromEvent reads live refs only, safe with empty deps
	useEffect(() => {
		function handleMove(e: PointerEvent) {
			if (!draggingRef.current) return;
			updateFromEvent(e.clientX, e.clientY);
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
			className="relative h-36 w-full cursor-crosshair"
			onPointerDown={event => {
				draggingRef.current = true;
				updateFromEvent(event.clientX, event.clientY);
			}}
			ref={panelRef}
			style={{
				backgroundColor: `hsl(${hue}, 100%, 50%)`,
				backgroundImage:
					"linear-gradient(to top, #000, transparent), linear-gradient(to right, #fff, transparent)",
			}}
		>
			<div
				aria-hidden
				className="absolute h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-medium"
				style={{
					backgroundColor: color,
					left: `${s * 100}%`,
					top: `${(1 - v) * 100}%`,
				}}
			/>
		</div>
	);
}
