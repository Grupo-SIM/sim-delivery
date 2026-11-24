import { useTranslation } from "react-i18next";
import { formatMoney } from "@/lib/formatMoney";
import { overriddenFeeLines } from "./overridden-fee-lines";
import type { CompanyFees } from "./types";

/** Read-only total of the buyer fees while it is overridden: no names, no associations. */
export function OverriddenFeesList({ buyerFeeOverride }: { buyerFeeOverride: CompanyFees["buyerFeeOverride"] }) {
	const { t } = useTranslation();
	const lines = overriddenFeeLines(buyerFeeOverride);
	return <div className="space-y-3">
		<p className="text-muted-foreground text-sm">{t("admin.companies.fees.buyerFees.overridden")}</p>
		{lines.length === 0 && <p className="text-muted-foreground text-sm">{t("admin.companies.fees.buyerFees.overriddenNone")}</p>}
		{lines.map(line => <div className="flex items-center justify-between rounded-md border border-border/60 p-3 text-sm" key={line.scope}>
			<span className="font-medium">{t(`admin.companies.fees.buyerFees.scope.${line.scope}`)}</span>
			<span className="tabular-nums">{[
				line.percentageBasisPoints ? `${(line.percentageBasisPoints / 100).toLocaleString("pt-BR", { maximumFractionDigits: 2 })}%` : null,
				line.fixedCents ? formatMoney(line.fixedCents) : null,
			].filter(Boolean).join(" + ")}</span>
		</div>)}
	</div>;
}
