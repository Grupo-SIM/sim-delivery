import { useTranslation } from "react-i18next";
import { formatFeeAmount } from "@/lib/platform-fees";
import type { CompanyFees } from "./types";

interface ExtraFeesListProps {
	extras: CompanyFees["extras"];
	mode: CompanyFees["mode"];
}

export function ExtraFeesList({ extras, mode }: ExtraFeesListProps) {
	const { t } = useTranslation();
	if (mode === "SIMINTPAY_ONLY") {
		return <p className="text-muted-foreground text-sm">{t("admin.companies.fees.extras.disabled")}</p>;
	}
	if (extras.length === 0) {
		return <p className="text-muted-foreground text-sm">{t("admin.companies.fees.extras.empty")}</p>;
	}
	return (
		<ul className="divide-y divide-border/60 rounded-md border border-border/60">
			{extras.map(fee => (
				<li className="flex items-center justify-between gap-3 px-3 py-2 text-sm" key={fee.id}>
					<span className="font-medium">{fee.name}</span>
					<span className="text-muted-foreground">
						{t(`admin.companies.fees.scope.${fee.applicationScope}`, { defaultValue: fee.applicationScope })}
						{" · "}
						{formatFeeAmount(fee.percentageValue, fee.fixedValue)}
					</span>
				</li>
			))}
		</ul>
	);
}
