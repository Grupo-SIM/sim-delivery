import { useTranslation } from "react-i18next";
import { Checkbox } from "@/components/ui/Checkbox";
import { cn } from "@/lib/utils";
import { OverrideValueInput } from "./OverrideValueInput";
import { type CoverageLane, type LaneDraft, type SimintpayLane, ppmToPercent, centsToReais, percentToPpm, reaisToCents } from "./types";

interface SimintpayLaneRowProps {
	accepted: boolean;
	applied: boolean;
	coverage: CoverageLane | undefined;
	draft: LaneDraft;
	/** Global SimIntPay fee for this lane, shown as placeholder while a field is empty. */
	globalDefault: SimintpayLane | undefined;
	lane: SimintpayLane;
	/** Sum of the additive fees charged in the current mode. */
	surcharge: { fixedCents: number; ratePpm: number };
	onAcceptedChange: (accepted: boolean) => void;
	onChange: (draft: LaneDraft) => void;
}

function formatCost(ratePpm: number | string, fixedCents: number | string) {
	const percent = (Number(ratePpm) / 10_000).toLocaleString("pt-BR", { maximumFractionDigits: 2 });
	const fixed = (Number(fixedCents) / 100).toLocaleString("pt-BR", { currency: "BRL", style: "currency" });
	return `${percent}% + ${fixed}`;
}

export function SimintpayLaneRow({ accepted, applied, coverage, draft, globalDefault, lane, surcharge, onAcceptedChange, onChange }: SimintpayLaneRowProps) {
	const { t } = useTranslation();
	const label =
		lane.method === "CREDIT_CARD"
			? t("admin.companies.fees.lane.creditCard", { count: Number(lane.installments) })
			: t(`admin.companies.fees.method.${lane.method}`, { defaultValue: lane.method });
	const effectiveRatePpm = surcharge.ratePpm + (applied ? percentToPpm(draft.rate) : 0);
	const effectiveFixedCents = surcharge.fixedCents + (applied ? reaisToCents(draft.fixed) : 0);
	const short = coverage && (effectiveRatePpm < Number(coverage.cost.ratePpm) || effectiveFixedCents < Number(coverage.cost.fixedCents));

	return (
		<tr className={cn("border-border/60 border-b last:border-0", !accepted && "opacity-50")}>
			<td className="px-3 py-2">
				<Checkbox
					aria-label={t("admin.companies.fees.accepted", { lane: label })}
					checked={accepted}
					name={`accepted-${lane.method}-${lane.installments}`}
					onChange={event => onAcceptedChange(event.currentTarget.checked)}
				/>
			</td>
			<td className="px-3 py-2 font-medium">{label}</td>
			<td className="px-3 py-2 text-muted-foreground">
				{coverage ? formatCost(coverage.cost.ratePpm, coverage.cost.fixedCents) : "—"}
			</td>
			<td className="px-3 py-2">
				<OverrideValueInput
					defaultValue={globalDefault && Number(globalDefault.ratePpm) / 10_000}
					kind="percentage"
					label={t("admin.companies.fees.simintpay.rate", { lane: label })}
					name={`rate-${lane.method}-${lane.installments}`}
					onCommit={rate => onChange({ ...draft, rate })}
					value={draft.rate}
				/>
			</td>
			<td className="px-3 py-2">
				<OverrideValueInput
					defaultValue={globalDefault && Number(globalDefault.fixedCents) / 100}
					kind="fixed"
					label={t("admin.companies.fees.simintpay.fixed", { lane: label })}
					name={`fixed-${lane.method}-${lane.installments}`}
					onCommit={fixed => onChange({ ...draft, fixed })}
					value={draft.fixed}
				/>
			</td>
			<td className="px-3 py-2 text-sm tabular-nums">
				{!accepted ? t("admin.companies.fees.coverage.notAccepted") : formatCost(effectiveRatePpm, effectiveFixedCents)}
			</td>
			<td className={cn("px-3 py-2 text-sm", short ? "text-destructive" : "text-muted-foreground")}>
				{coverage
						? short
							? t("admin.companies.fees.coverage.short")
							: t("admin.companies.fees.coverage.ok")
						: t("admin.companies.fees.coverage.notAccepted")}
			</td>
		</tr>
	);
}

export function initialDraft(lane: SimintpayLane): LaneDraft {
	return { fixed: centsToReais(lane.fixedCents), rate: ppmToPercent(lane.ratePpm) };
}
