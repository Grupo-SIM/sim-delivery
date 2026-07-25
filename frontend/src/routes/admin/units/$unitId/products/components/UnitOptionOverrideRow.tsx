import { useTranslation } from "react-i18next";
import { Checkbox } from "@/components/ui/Checkbox";
import { CurrencyInput } from "@/components/ui/CurrencyInput";
import type { UnitOptionOverride } from "./UnitOptionOverridesFields";

interface UnitOptionOverrideRowProps {
	disabled: boolean;
	onDisabledChange: (disabled: boolean) => void;
	onPriceChange: (priceDeltaCents: number | null) => void;
	option: { id: string; name: string; priceDeltaCents: number | string };
	override: UnitOptionOverride | undefined;
}

export function UnitOptionOverrideRow({
	disabled,
	onDisabledChange,
	onPriceChange,
	option,
	override,
}: UnitOptionOverrideRowProps) {
	const { t } = useTranslation();
	return (
		<div className="flex items-center gap-2 text-sm">
			<span>{option.name}</span>
			<div className="ml-auto flex items-center gap-1">
				<label className="cursor-pointer" htmlFor={`option-disabled-${option.id}`}>
					{t("admin.unitProducts.options.disable")}
				</label>
				<Checkbox
					checked={disabled}
					id={`option-disabled-${option.id}`}
					onChange={event => onDisabledChange(event.currentTarget.checked)}
				/>
				<CurrencyInput
					className="ml-1 w-28"
					disabled={disabled}
					onValueChange={({ floatValue }) =>
						onPriceChange(floatValue === null ? null : Math.round(floatValue * 100))
					}
					placeholder={`R$ ${(Number(option.priceDeltaCents) / 100).toFixed(2).replace(".", ",")}`}
					value={Number(override?.priceDeltaCents ?? 0) / 100}
				/>
			</div>
		</div>
	);
}
