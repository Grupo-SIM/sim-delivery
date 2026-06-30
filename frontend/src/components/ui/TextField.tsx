import { FormControl, type FormControlProps } from "baseui/form-control";
import { Input, type InputProps } from "baseui/input";
import { useDebouncedInput } from "@/hooks/use-debounced-input";

interface TextFieldProps extends Omit<InputProps, "error" | "onChange" | "value"> {
	caption?: FormControlProps["caption"];
	error?: FormControlProps["error"];
	label: FormControlProps["label"];
	onValueChange: (value: string) => void;
	value: string;
}

export function TextField({
	caption,
	error,
	label,
	onBlur,
	onValueChange,
	overrides,
	placeholder,
	type = "text",
	value,
	...props
}: TextFieldProps) {
	const shouldDebounce = type === "text" || type === "search";
	const [localValue, setLocalValue, flushLocalValue] = useDebouncedInput(value, onValueChange);
	const inputValue = shouldDebounce ? localValue : value;

	return (
		<FormControl
			caption={caption}
			error={error}
			label={label}
			overrides={{
				ControlContainer: { style: { marginBottom: 0 } },
				Label: {
					style: {
						color: "var(--muted-foreground)",
						fontSize: "12px",
						fontWeight: 800,
						letterSpacing: "0.04em",
						textTransform: "uppercase",
					},
				},
			}}
		>
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
				overrides={{
					...overrides,
					InputContainer: {
						...overrides?.InputContainer,
						style: {
							backgroundColor: "var(--surface-sunken)",
							borderColor: "var(--input)",
							borderRadius: "4px",
						},
					},
					Input: {
						...overrides?.Input,
						style: {
							color: "var(--foreground)",
						},
					},
				}}
				placeholder={placeholder}
				type={type}
				value={inputValue}
				{...props}
			/>
		</FormControl>
	);
}
