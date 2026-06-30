import { useEffect, useState } from "react";

/**
 * Live countdown to a target instant. Returns the remaining milliseconds,
 * re-rendering every second, and `0` once the target has passed (or when no
 * target is given). Pass `null`/`undefined` to disable the interval.
 */
export function useCountdown(target?: string | Date | null): number {
	const targetMs = target ? new Date(target).getTime() : null;
	const [remaining, setRemaining] = useState(() =>
		targetMs === null ? 0 : Math.max(0, targetMs - Date.now()),
	);

	useEffect(() => {
		if (targetMs === null) {
			setRemaining(0);
			return;
		}
		const tick = () => setRemaining(Math.max(0, targetMs - Date.now()));
		tick();
		const id = setInterval(tick, 1000);
		return () => clearInterval(id);
	}, [targetMs]);

	return remaining;
}

/** Formats a millisecond duration as HH:MM:SS (hours uncapped). */
export function formatCountdown(ms: number): string {
	const totalSeconds = Math.floor(ms / 1000);
	const hours = Math.floor(totalSeconds / 3600);
	const minutes = Math.floor((totalSeconds % 3600) / 60);
	const seconds = totalSeconds % 60;
	const pad = (n: number) => String(n).padStart(2, "0");
	return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}
