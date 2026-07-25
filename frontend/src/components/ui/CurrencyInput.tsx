import type { ComponentPropsWithoutRef } from "react";
import { NumericInput } from "./NumericInput";

interface CurrencyInputProps
	extends Omit<ComponentPropsWithoutRef<typeof NumericInput>, "onValueChange" | "value"> {
	onValueChange: (values: { floatValue: number | null }) => void;
	value: number | null;
}

/** Bank-style BRL input. Digits type from the right and always preserve two decimal places. */
export function CurrencyInput({ onValueChange, value, ...props }: CurrencyInputProps) {
	return (
		<NumericInput
			decimalScale={2}
			decimalSeparator=","
			onValueChange={({ floatValue, isEmpty }) => onValueChange({ floatValue: isEmpty ? null : floatValue })}
			placeholder="R$ 0,00"
			prefix="R$ "
			thousandSeparator="."
			value={value}
			{...props}
		/>
	);
}
