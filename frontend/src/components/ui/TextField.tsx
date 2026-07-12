import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useDebouncedInput } from "@/hooks/use-debounced-input";

interface TextFieldProps extends Omit<ComponentPropsWithoutRef<"input">, "onChange" | "value"> {
	label: ReactNode;
	onValueChange: (value: string) => void;
	value: string;
}

export function TextField({ label, onBlur, onValueChange, type = "text", value, ...props }: TextFieldProps) {
	const shouldDebounce = type === "text" || type === "search";
	const [localValue, setLocalValue, flushLocalValue] = useDebouncedInput(value, onValueChange);
	const inputValue = shouldDebounce ? localValue : value;

	return (
		<Label>
			{label}
			<Input
				onBlur={event => {
					if (shouldDebounce) flushLocalValue();
					onBlur?.(event);
				}}
				onChange={event => {
					const next = event.currentTarget.value;
					if (shouldDebounce) {
						setLocalValue(next);
						return;
					}
					onValueChange(next);
				}}
				type={type}
				value={inputValue}
				{...props}
			/>
		</Label>
	);
}
