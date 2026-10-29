import { useTranslation } from "react-i18next";
import { explicitUnitFees, type ProductFee } from "@/lib/platform-fees";
import { cn } from "@/lib/utils";
import { money } from "./types";

interface ProductFeeSummaryProps {
	className?: string;
	fees: ProductFee[];
	priceCents: number;
	quantity?: number;
}

export function ProductFeeSummary({ className, fees, priceCents, quantity = 1 }: ProductFeeSummaryProps) {
	const { t } = useTranslation();
	const amount = explicitUnitFees(priceCents, fees) * quantity;
	if (amount === 0) return null;

	return (
		<span className={cn("block whitespace-nowrap text-[11px] font-normal leading-tight", className)}>
			{t("store.product.feesSummary", { amount: money.format(amount / 100) })}
		</span>
	);
}
