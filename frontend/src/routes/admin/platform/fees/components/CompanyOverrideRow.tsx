import { useRef, useState } from "react";
import { NumericFormat } from "react-number-format";
import { LuRotateCcw } from "react-icons/lu";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/Checkbox";
import { Tooltip } from "@/components/ui/Tooltip";
import { useDebouncedInput } from "@/hooks/use-debounced-input";
import type { GetPlatformFeesByFeeIdCompanies200 } from "@/lib/api";

type CompanyFee = GetPlatformFeesByFeeIdCompanies200[number];

interface CompanyOverrideRowProps {
	calculationType: "fixed" | "percentage";
	company: CompanyFee;
	onReset: (companyId: string) => Promise<CompanyFee | undefined>;
	onSave: (companyId: string, active: boolean, valueOverride: number | null) => Promise<boolean>;
}

export function CompanyOverrideRow({ calculationType, company, onReset, onSave }: CompanyOverrideRowProps) {
	const [active, setActive] = useState(company.active);
	const [value, setValue] = useState(company.valueOverride == null ? "" : String(Number(company.valueOverride) / 100));
	const activeRef = useRef(active);
	const pending = useRef(Promise.resolve());
	const lastSubmitted = useRef<{ active: boolean; valueOverride: number | null } | null>({ active, valueOverride: company.valueOverride == null ? null : Number(company.valueOverride) });

	function save(nextActive: boolean, nextValue: string) {
		const valueOverride = nextValue === "" ? null : Math.round(Number(nextValue) * 100);
		if (lastSubmitted.current?.active === nextActive && lastSubmitted.current.valueOverride === valueOverride) return;
		const submitted = { active: nextActive, valueOverride };
		lastSubmitted.current = submitted;
		pending.current = pending.current.then(async () => {
			const saved = await onSave(company.companyId, nextActive, valueOverride);
			if (!saved && lastSubmitted.current === submitted) lastSubmitted.current = null;
		});
	}

	const [localValue, setLocalValue, flushValue] = useDebouncedInput(value, next => {
		setValue(next);
		save(activeRef.current, next);
	});

	function reset() {
		flushValue();
		pending.current = pending.current.then(async () => {
			const restored = await onReset(company.companyId);
			if (!restored) return;
			activeRef.current = restored.active;
			setActive(restored.active);
			setValue(restored.valueOverride == null ? "" : String(Number(restored.valueOverride) / 100));
			lastSubmitted.current = { active: restored.active, valueOverride: restored.valueOverride == null ? null : Number(restored.valueOverride) };
		});
	}

	return (
		<tr className="border-border border-b last:border-0">
			<td className="break-words px-3 py-3 font-medium">{company.companyName}</td>
			<td className="px-3 py-3">
				<NumericFormat
					allowNegative={false}
					className="h-9 min-w-0 w-full rounded-md border border-input bg-surface text-card-foreground px-3 text-sm placeholder:text-muted-foreground/70"
					decimalScale={2}
					decimalSeparator=","
					isAllowed={({ floatValue }) => floatValue === undefined || (floatValue > 0 && (calculationType !== "percentage" || floatValue <= 100))}
					aria-label={`Valor próprio de ${company.companyName}`}
					inputMode="decimal"
					name={`company-fee-${company.companyId}`}
					onBlur={flushValue}
					onValueChange={(values, source) => { if (source.source === "event") setLocalValue(values.value); }}
					placeholder={calculationType === "fixed" ? "Ex: R$ 2,00" : "Ex: 2,00%"}
					prefix={calculationType === "fixed" ? "R$ " : undefined}
					suffix={calculationType === "percentage" ? "%" : undefined}
					thousandSeparator="."
					value={localValue}
					valueIsNumericString
				/>
			</td>
			<td className="px-3 py-3 text-center">
				<Checkbox aria-label={`Ativar em ${company.companyName}`} checked={active} onChange={event => {
					activeRef.current = event.currentTarget.checked;
					setActive(activeRef.current);
					flushValue();
					save(activeRef.current, localValue);
				}} />
			</td>
			<td className="px-3 py-3">
				<div className="flex justify-end gap-2">
					<Tooltip content="Restaurar padrão"><Button aria-label="Restaurar padrão" disabled={company.inherited} onClick={reset} size="icon" type="button" variant="outline"><LuRotateCcw /></Button></Tooltip>
				</div>
			</td>
		</tr>
	);
}
