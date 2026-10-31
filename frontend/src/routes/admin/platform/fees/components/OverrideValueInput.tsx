import { NumericFormat } from "react-number-format";
import { useDebouncedInput } from "@/hooks/use-debounced-input";

interface OverrideValueInputProps {
	/** Global default (percent or reais as a number) shown as placeholder while the field is empty. */
	defaultValue?: number;
	kind: "fixed" | "percentage";
	label: string;
	name: string;
	onCommit: (value: string) => void;
	value: string;
}

function defaultPlaceholder(kind: "fixed" | "percentage", defaultValue: number | undefined) {
	if (defaultValue === undefined) return kind === "fixed" ? "Ex: R$ 1,00" : "Ex: 4,00%";
	const text = defaultValue.toLocaleString("pt-BR", { maximumFractionDigits: 2, minimumFractionDigits: 2 });
	return kind === "fixed" ? `R$ ${text}` : `${text}%`;
}

export function OverrideValueInput({ defaultValue, kind, label, name, onCommit, value }: OverrideValueInputProps) {
	const [local, setLocal, flush] = useDebouncedInput(value, onCommit);

	return (
		<NumericFormat
			allowNegative={false}
			aria-label={label}
			className="h-9 min-w-0 w-full rounded-md border border-input bg-surface text-card-foreground px-3 text-sm placeholder:text-muted-foreground/70"
			decimalScale={2}
			decimalSeparator=","
			inputMode="decimal"
			isAllowed={({ floatValue }) => floatValue === undefined || kind === "fixed" || floatValue <= 100}
			name={name}
			onBlur={flush}
			onValueChange={(values, source) => { if (source.source === "event") setLocal(values.value); }}
			placeholder={defaultPlaceholder(kind, defaultValue)}
			prefix={kind === "fixed" ? "R$ " : undefined}
			suffix={kind === "percentage" ? "%" : undefined}
			thousandSeparator="."
			value={local}
			valueIsNumericString
		/>
	);
}
