import { useTranslation } from "react-i18next";
import { NumericFormat } from "react-number-format";
import { Input } from "@/components/ui/input";
import { useDebouncedInput } from "@/hooks/use-debounced-input";
import type { UnitAdditionalOption } from "./UnitOptionOverridesFields";

interface UnitAdditionalOptionRowProps {
	onChange: (option: UnitAdditionalOption) => void;
	onRemove: () => void;
	option: UnitAdditionalOption;
}

export function UnitAdditionalOptionRow({ onChange, onRemove, option }: UnitAdditionalOptionRowProps) {
	const { t } = useTranslation();
	const [name, setName] = useDebouncedInput(option.name, value => onChange({ ...option, name: value }));
	const [description, setDescription] = useDebouncedInput(option.description, value =>
		onChange({ ...option, description: value }),
	);

	return (
		<div className="grid gap-2 rounded border border-border p-2 md:grid-cols-[1fr_1fr_8rem_auto]">
			<Input onChange={event => setName(event.currentTarget.value)} placeholder="Ex: Borda de cheddar" value={name} />
			<Input onChange={event => setDescription(event.currentTarget.value)} placeholder="Ex: Cremosa e gratinada" value={description} />
			<NumericFormat
				customInput={Input}
				decimalScale={2}
				decimalSeparator=","
				onValueChange={({ floatValue }) => onChange({ ...option, priceDeltaCents: Math.max(0, Math.round((floatValue ?? 0) * 100)) })}
				placeholder="R$ 5,00"
				prefix="R$ "
				thousandSeparator="."
				value={option.priceDeltaCents / 100}
			/>
			<button className="cursor-pointer rounded border border-border px-2 text-sm" onClick={onRemove} type="button">
				{t("admin.products.options.delete")}
			</button>
		</div>
	);
}
