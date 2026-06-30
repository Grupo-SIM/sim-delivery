import { Input } from "baseui/input";
import type { ComponentProps, ComponentType } from "react";
import { NumericFormat, type NumericFormatProps } from "react-number-format";

type NumericInputProps = NumericFormatProps<ComponentProps<typeof Input>>;

export function NumericInput({
	allowLeadingZeros,
	decimalScale,
	decimalSeparator,
	onValueChange,
	prefix,
	suffix,
	thousandSeparator,
	value,
	...inputProps
}: NumericInputProps) {
	return (
		// @ts-expect-error — ARIA attribute types in react-number-format are narrower than React's
		<NumericFormat
			allowLeadingZeros={allowLeadingZeros}
			customInput={Input as ComponentType<object>}
			decimalScale={decimalScale}
			decimalSeparator={decimalSeparator}
			onValueChange={onValueChange}
			prefix={prefix}
			suffix={suffix}
			thousandSeparator={thousandSeparator}
			value={value}
			{...inputProps}
		/>
	);
}
