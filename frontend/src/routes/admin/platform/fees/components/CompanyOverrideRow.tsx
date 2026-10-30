import { useRef, useState } from "react";
import { LuRotateCcw } from "react-icons/lu";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/Checkbox";
import { Tooltip } from "@/components/ui/Tooltip";
import type { GetPlatformFeesByFeeIdCompanies200 } from "@/lib/api";
import { OverrideValueInput } from "./OverrideValueInput";

type CompanyFee = GetPlatformFeesByFeeIdCompanies200[number];

export interface FeeOverrideValues {
	active: boolean;
	fixedOverride: number | null;
	percentageOverride: number | null;
}

interface CompanyOverrideRowProps {
	company: CompanyFee;
	onReset: (companyId: string) => Promise<CompanyFee | undefined>;
	onSave: (companyId: string, values: FeeOverrideValues) => Promise<boolean>;
}

function toInput(cents: number | string | null) {
	return cents == null ? "" : String(Number(cents) / 100);
}

function toCents(input: string) {
	return input === "" ? null : Math.round(Number(input) * 100);
}

function toValues(company: CompanyFee): FeeOverrideValues {
	return {
		active: company.active,
		fixedOverride: company.fixedOverride == null ? null : Number(company.fixedOverride),
		percentageOverride: company.percentageOverride == null ? null : Number(company.percentageOverride),
	};
}

export function CompanyOverrideRow({ company, onReset, onSave }: CompanyOverrideRowProps) {
	const [active, setActive] = useState(company.active);
	const [resetKey, setResetKey] = useState(0);
	const current = useRef(toInputs(company));
	const pending = useRef(Promise.resolve());
	const lastSubmitted = useRef<FeeOverrideValues | null>(toValues(company));

	function toInputs(source: CompanyFee) {
		return { active: source.active, fixed: toInput(source.fixedOverride), percentage: toInput(source.percentageOverride) };
	}

	function save() {
		const values: FeeOverrideValues = {
			active: current.current.active,
			fixedOverride: toCents(current.current.fixed),
			percentageOverride: toCents(current.current.percentage),
		};
		const last = lastSubmitted.current;
		if (last?.active === values.active && last.fixedOverride === values.fixedOverride && last.percentageOverride === values.percentageOverride) return;
		lastSubmitted.current = values;
		pending.current = pending.current.then(async () => {
			const saved = await onSave(company.companyId, values);
			if (!saved && lastSubmitted.current === values) lastSubmitted.current = null;
		});
	}

	function reset() {
		pending.current = pending.current.then(async () => {
			const restored = await onReset(company.companyId);
			if (!restored) return;
			current.current = toInputs(restored);
			setActive(restored.active);
			setResetKey(key => key + 1);
			lastSubmitted.current = toValues(restored);
		});
	}

	return (
		<tr className="border-border border-b last:border-0">
			<td className="break-words px-3 py-3 font-medium">{company.companyName}</td>
			<td className="px-3 py-3">
				<OverrideValueInput
					key={`percentage-${resetKey}`}
					kind="percentage"
					label={`Percentual próprio de ${company.companyName}`}
					name={`company-fee-percentage-${company.companyId}`}
					onCommit={value => { current.current.percentage = value; save(); }}
					value={current.current.percentage}
				/>
			</td>
			<td className="px-3 py-3">
				<OverrideValueInput
					key={`fixed-${resetKey}`}
					kind="fixed"
					label={`Valor fixo próprio de ${company.companyName}`}
					name={`company-fee-fixed-${company.companyId}`}
					onCommit={value => { current.current.fixed = value; save(); }}
					value={current.current.fixed}
				/>
			</td>
			<td className="px-3 py-3 text-center">
				<Checkbox aria-label={`Ativar em ${company.companyName}`} checked={active} onChange={event => {
					current.current.active = event.currentTarget.checked;
					setActive(current.current.active);
					save();
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
