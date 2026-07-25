import {
	type ComponentPropsWithoutRef,
	type KeyboardEvent,
	useEffect,
	useLayoutEffect,
	useRef,
	useState,
} from "react";
import { Input } from "@/components/ui/input";

interface NumericInputProps extends Omit<ComponentPropsWithoutRef<"input">, "onChange" | "prefix" | "value"> {
	decimalScale?: number;
	decimalSeparator?: string;
	onValueChange: (values: { floatValue: number; isEmpty: boolean }) => void;
	prefix?: string;
	suffix?: string;
	thousandSeparator?: string;
	value: number | null;
}

function toDigits(value: number | null, decimalScale: number) {
	if (value === null) return "";
	return String(Math.round(Math.abs(value) * 10 ** decimalScale)) || "0";
}

function normalizeDigits(digits: string) {
	return digits.replace(/^0+(?=\d)/, "").slice(-15) || "0";
}

function formatDigits(
	digits: string,
	decimalScale: number,
	decimalSeparator: string,
	thousandSeparator: string,
	prefix: string,
	suffix: string,
) {
	if (digits === "") return "";
	const padded = digits.padStart(decimalScale + 1, "0");
	const integerPart = decimalScale > 0 ? padded.slice(0, -decimalScale) : padded;
	const decimalPart = decimalScale > 0 ? padded.slice(-decimalScale) : "";
	const groupedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, thousandSeparator);
	const decimals = decimalScale > 0 ? `${decimalSeparator}${decimalPart}` : "";
	return `${prefix}${groupedInteger}${decimals}${suffix}`;
}

/**
 * Bank-style numeric input: digits always type in from the right (like a POS terminal).
 * Only actual edits (typing a digit, backspace, delete, paste) touch the caret — native
 * selection, copy and navigation (Ctrl+A, arrow keys, clicking to read the value) are
 * left alone so they don't fight the user.
 */
export function NumericInput({
	decimalScale = 2,
	decimalSeparator = ",",
	onValueChange,
	prefix = "",
	suffix = "",
	thousandSeparator = ".",
	value,
	...props
}: NumericInputProps) {
	const inputRef = useRef<HTMLInputElement>(null);
	const [digits, setDigits] = useState(() => toDigits(value, decimalScale));
	const historyRef = useRef<string[]>([]);
	const redoRef = useRef<string[]>([]);

	useEffect(() => {
		if (document.activeElement === inputRef.current) return;
		const nextDigits = toDigits(value, decimalScale);
		setDigits(nextDigits);
		historyRef.current = [];
		redoRef.current = [];
	}, [value, decimalScale]);

	const formatted = formatDigits(digits, decimalScale, decimalSeparator, thousandSeparator, prefix, suffix);

	function commit(nextDigits: string, recordHistory = true) {
		if (nextDigits === digits) return;
		if (recordHistory) {
			historyRef.current = [...historyRef.current.slice(-99), digits];
			redoRef.current = [];
		}
		setDigits(nextDigits);
		onValueChange({
			floatValue: Number(nextDigits || 0) / 10 ** decimalScale,
			isEmpty: nextDigits === "",
		});
	}

	function handleNativeInput(event: React.FormEvent<HTMLInputElement>) {
		const nextDigits = normalizeDigits(event.currentTarget.value.replace(/\D/g, ""));
		if (nextDigits === digits) return;
		commit(nextDigits);
	}

	useLayoutEffect(() => {
		const input = inputRef.current;
		if (!input || document.activeElement !== input) return;
		const position = input.value.length - suffix.length;
		input.setSelectionRange(position, position);
	}, [suffix]);

	function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
		if (event.ctrlKey || event.metaKey) {
			if (event.key.toLowerCase() === "z") {
				event.preventDefault();
				const nextDigits = event.shiftKey ? redoRef.current.pop() : historyRef.current.pop();
				if (nextDigits === undefined) return;
				if (event.shiftKey) historyRef.current.push(digits);
				else redoRef.current.push(digits);
				commit(nextDigits, false);
				return;
			}
			if (event.key.toLowerCase() === "y") {
				event.preventDefault();
				const nextDigits = redoRef.current.pop();
				if (nextDigits === undefined) return;
				historyRef.current.push(digits);
				commit(nextDigits, false);
			}
			return;
		}

		const input = event.currentTarget;
		const hasSelection = input.selectionStart !== input.selectionEnd;

		if (/^[0-9]$/.test(event.key)) {
			event.preventDefault();
			commit(normalizeDigits(`${hasSelection ? "" : digits}${event.key}`));
			return;
		}
		if (event.key === "Backspace") {
			event.preventDefault();
			commit(hasSelection || digits.length <= 1 ? "" : digits.slice(0, -1));
			return;
		}
		if (event.key === "Delete" && hasSelection) {
			event.preventDefault();
			commit("");
		}
	}

	return (
		<Input
			inputMode="decimal"
			onChange={handleNativeInput}
			onKeyDown={handleKeyDown}
			onPaste={event => {
				const pasted = event.clipboardData.getData("text").replace(/\D/g, "");
				if (!pasted) return;
				event.preventDefault();
				const { selectionEnd, selectionStart } = event.currentTarget;
				commit(normalizeDigits(selectionStart !== selectionEnd ? pasted : digits + pasted));
			}}
			ref={inputRef}
			value={formatted}
			{...props}
		/>
	);
}
