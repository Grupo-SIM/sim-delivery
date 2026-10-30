import { NumericFormat } from "react-number-format";

interface FeeValueInputProps {
	kind: "fixed" | "percentage";
	name: string;
	onChange: (cents: number) => void;
	value: number;
}

export function FeeValueInput({ kind, name, onChange, value }: FeeValueInputProps) {
	return (
		<NumericFormat
			allowNegative={false}
			className="flex h-11 w-full rounded-md border border-input bg-surface text-card-foreground px-3 py-2 text-sm placeholder:text-muted-foreground/70"
			decimalScale={2}
			decimalSeparator=","
			inputMode="decimal"
			isAllowed={({ floatValue }) => floatValue === undefined || kind === "fixed" || floatValue <= 100}
			name={name}
			onValueChange={({ floatValue }) => onChange(Math.round((floatValue ?? 0) * 100))}
			placeholder={kind === "percentage" ? "Ex: 4,00%" : "Ex: R$ 1,00"}
			prefix={kind === "fixed" ? "R$ " : undefined}
			suffix={kind === "percentage" ? "%" : undefined}
			thousandSeparator="."
			value={value > 0 ? value / 100 : ""}
		/>
	);
}
