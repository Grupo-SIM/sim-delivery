import { useCallback, useEffect, useRef, useState } from "react";

export function useDebouncedInput(externalValue: string, onChange: (value: string) => void, delay = 300) {
	const [local, setLocal] = useState(externalValue);
	const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
	const lastSent = useRef(externalValue);
	const onChangeRef = useRef(onChange);

	useEffect(() => {
		onChangeRef.current = onChange;
	}, [onChange]);

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
				onChangeRef.current(next);
			}, delay);
		},
		[delay],
	);

	const flush = useCallback(() => {
		clearTimeout(timer.current);
		lastSent.current = local;
		onChangeRef.current(local);
	}, [local]);

	return [local, handleChange, flush] as const;
}
