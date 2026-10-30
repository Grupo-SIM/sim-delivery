import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { OverrideValueInput } from "@/routes/admin/platform/fees/components/OverrideValueInput";
import { type CoverageLane, type LaneDraft, type SimintpayLane, ppmToPercent, centsToReais } from "./types";

interface SimintpayLaneRowProps {
	coverage: CoverageLane | undefined;
	disabled: boolean;
	draft: LaneDraft;
	lane: SimintpayLane;
	onChange: (draft: LaneDraft) => void;
}

function formatCost(ratePpm: number | string, fixedCents: number | string) {
	const percent = (Number(ratePpm) / 10_000).toLocaleString("pt-BR", { maximumFractionDigits: 2 });
	const fixed = (Number(fixedCents) / 100).toLocaleString("pt-BR", { currency: "BRL", style: "currency" });
	return `${percent}% + ${fixed}`;
}

export function SimintpayLaneRow({ coverage, disabled, draft, lane, onChange }: SimintpayLaneRowProps) {
	const { t } = useTranslation();
	const label =
		lane.method === "CREDIT_CARD"
			? t("admin.companies.fees.lane.creditCard", { count: Number(lane.installments) })
			: t(`admin.companies.fees.method.${lane.method}`, { defaultValue: lane.method });
	const short = coverage && (Number(coverage.rateShortfallPpm) > 0 || Number(coverage.fixedShortfallCents) > 0);

	return (
		<tr className="border-border/60 border-b last:border-0">
			<td className="px-3 py-2 font-medium">{label}</td>
			<td className="px-3 py-2 text-muted-foreground">
				{coverage ? formatCost(coverage.cost.ratePpm, coverage.cost.fixedCents) : "—"}
			</td>
			<td className="px-3 py-2">
				<OverrideValueInput
					kind="percentage"
					label={t("admin.companies.fees.simintpay.rate", { lane: label })}
					name={`rate-${lane.method}-${lane.installments}`}
					onCommit={rate => onChange({ ...draft, rate })}
					value={draft.rate}
				/>
			</td>
			<td className="px-3 py-2">
				<OverrideValueInput
					kind="fixed"
					label={t("admin.companies.fees.simintpay.fixed", { lane: label })}
					name={`fixed-${lane.method}-${lane.installments}`}
					onCommit={fixed => onChange({ ...draft, fixed })}
					value={draft.fixed}
				/>
			</td>
			<td className={cn("px-3 py-2 text-sm", short ? "text-destructive" : "text-muted-foreground")}>
				{disabled
					? t("admin.companies.fees.coverage.notCounted")
					: coverage
						? short
							? t("admin.companies.fees.coverage.short")
							: t("admin.companies.fees.coverage.ok")
						: "—"}
			</td>
		</tr>
	);
}

export function initialDraft(lane: SimintpayLane): LaneDraft {
	return { fixed: centsToReais(lane.fixedCents), rate: ppmToPercent(lane.ratePpm) };
}
