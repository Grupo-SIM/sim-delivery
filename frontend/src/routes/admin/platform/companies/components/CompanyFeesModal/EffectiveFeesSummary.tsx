import { useTranslation } from "react-i18next";
import { formatFeeAmount } from "@/lib/platform-fees";
import type { CompanyFees, FeeMode } from "./types";

interface EffectiveFeesSummaryProps {
	fees: CompanyFees;
	mode: FeeMode;
}

export function EffectiveFeesSummary({ fees, mode }: EffectiveFeesSummaryProps) {
	const { t } = useTranslation();
	const scopes = [...new Set(fees.extras.map(fee => fee.applicationScope))];
	return (
		<section className="space-y-3 rounded-lg border p-4 text-sm">
			<h3 className="font-semibold">{t("admin.companies.fees.summary.title")}</h3>
			<div className="space-y-1">
				<p className="font-medium">{t("admin.companies.fees.summary.buyer")}</p>
				{mode === "SIMINTPAY_ONLY" ? (
					<p className="text-muted-foreground">{t("admin.companies.fees.extras.disabled")}</p>
				) : fees.mode === "SIMINTPAY_ONLY" ? (
					<p className="text-muted-foreground">{t("admin.companies.fees.summary.unavailable")}</p>
				) : scopes.length === 0 ? (
					<p className="text-muted-foreground">{t("admin.companies.fees.extras.empty")}</p>
				) : (
					<ul className="space-y-2">
						{scopes.map(scope => (
							<li key={scope}>
								<span className="font-medium">{t(`admin.companies.fees.scope.${scope}`, { defaultValue: scope })}</span>
								<ul className="text-muted-foreground">
									{fees.extras.filter(fee => fee.applicationScope === scope).map(fee => (
										<li key={fee.id}>{fee.name}: {formatFeeAmount(fee.percentageValue, fee.fixedValue)}</li>
									))}
								</ul>
							</li>
						))}
					</ul>
				)}
			</div>
			<p><span className="font-medium">{t("admin.companies.fees.summary.merchant")}</span>{" "}{t(mode === "ADDITIVE_ONLY" ? "admin.companies.fees.summary.merchantDisabled" : "admin.companies.fees.summary.merchantActive")}</p>
			<p className="text-muted-foreground">{t("admin.companies.fees.summary.bases")}</p>
			<p className="text-muted-foreground">{t("admin.companies.fees.summary.saved")}</p>
		</section>
	);
}
