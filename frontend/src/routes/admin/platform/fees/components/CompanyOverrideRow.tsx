import { useState } from "react";
import { NumericFormat } from "react-number-format";
import { LuRotateCcw, LuSave } from "react-icons/lu";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/Checkbox";
import { Tooltip } from "@/components/ui/Tooltip";
import type { GetPlatformFeesByFeeIdCompanies200 } from "@/lib/api";

type CompanyFee = GetPlatformFeesByFeeIdCompanies200[number];

interface CompanyOverrideRowProps {
	calculationType: "fixed" | "percentage";
	company: CompanyFee;
	onReset: (companyId: string) => void;
	onSave: (companyId: string, active: boolean, valueOverride: number | null) => void;
}

export function CompanyOverrideRow({ calculationType, company, onReset, onSave }: CompanyOverrideRowProps) {
	const [active, setActive] = useState(company.active);
	const [value, setValue] = useState<number | null>(company.valueOverride == null ? null : Number(company.valueOverride));

	return (
		<tr className="border-border border-b last:border-0">
			<td className="px-3 py-3 font-medium">{company.companyName}</td>
			<td className="px-3 py-3">
				<NumericFormat
					allowNegative={false}
					className="h-9 w-full rounded-md border border-input bg-surface text-card-foreground px-3 text-sm placeholder:text-muted-foreground/70"
					decimalScale={2}
					decimalSeparator=","
					isAllowed={({ floatValue }) => floatValue === undefined || (floatValue > 0 && (calculationType !== "percentage" || floatValue <= 100))}
					onValueChange={({ floatValue }) => setValue(floatValue == null ? null : Math.round(floatValue * 100))}
					placeholder={calculationType === "fixed" ? "Ex: R$ 2,00" : "Ex: 2,00%"}
					prefix={calculationType === "fixed" ? "R$ " : undefined}
					suffix={calculationType === "percentage" ? "%" : undefined}
					thousandSeparator="."
					value={value == null ? "" : value / 100}
				/>
			</td>
			<td className="px-3 py-3 text-center">
				<Checkbox aria-label={`Ativar em ${company.companyName}`} checked={active} onChange={event => setActive(event.currentTarget.checked)} />
			</td>
			<td className="px-3 py-3">
				<div className="flex justify-end gap-2">
					<Tooltip content="Salvar sobrescrita"><Button aria-label="Salvar sobrescrita" onClick={() => onSave(company.companyId, active, value)} size="icon" type="button" variant="outline"><LuSave /></Button></Tooltip>
					<Tooltip content="Restaurar padrão"><Button aria-label="Restaurar padrão" disabled={company.inherited} onClick={() => onReset(company.companyId)} size="icon" type="button" variant="outline"><LuRotateCcw /></Button></Tooltip>
				</div>
			</td>
		</tr>
	);
}
