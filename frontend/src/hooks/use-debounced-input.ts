import { useCallback, useEffect, useRef, useState } from "react";

export function useDebouncedInput(externalValue: string, onChange: (value: string) => void, delay = 300) {
	const [local, setLocal] = useState(externalValue);
	const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
	const lastSent = useRef(externalValue);

	useEffect(() => {
		if (externalValue !== lastSent.current) {
			setLocal(externalValue);
			lastSent.current = externalValue;
		}
	}, [externalValue]);

	const handleChange = useCallback(
		(next: string) => {
			setLocal(next);
			clearTimeout(timer.current);
			timer.current = setTimeout(() => {
				lastSent.current = next;
				onChange(next);
			}, delay);
		},
		[delay, onChange],
	);

	const flush = useCallback(() => {
		clearTimeout(timer.current);
		lastSent.current = local;
		onChange(local);
	}, [local, onChange]);

	return [local, handleChange, flush] as const;
}
