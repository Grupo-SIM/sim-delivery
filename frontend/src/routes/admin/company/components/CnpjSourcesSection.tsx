import { useTranslation } from "react-i18next";
import { LuFileText } from "react-icons/lu";
import { CollapsibleSection } from "@/components/ui/CollapsibleSection";
import { CustomSelect } from "@/components/ui/CustomSelect";

type CnpjSource = "COMPANY" | "UNIT";

interface CnpjSourcesSectionProps {
	onOrderChange: (value: CnpjSource) => void;
	onWithdrawalChange: (value: CnpjSource) => void;
	orderSource: CnpjSource;
	withdrawalSource: CnpjSource;
}

function SourceField({ hint, label, onChange, value }: { hint: string; label: string; onChange: (value: CnpjSource) => void; value: CnpjSource }) {
	const { t } = useTranslation();
	return (
		<div className="space-y-2">
			<span className="font-medium text-sm">{label}</span>
			<CustomSelect
				ariaLabel={label}
				onChange={next => onChange(next as CnpjSource)}
				options={[
					{ label: t("admin.branding.cnpjSources.unit"), value: "UNIT" },
					{ label: t("admin.branding.cnpjSources.company"), value: "COMPANY" },
				]}
				value={value}
			/>
			<p className="text-muted-foreground text-xs">{hint}</p>
		</div>
	);
}

export function CnpjSourcesSection({ onOrderChange, onWithdrawalChange, orderSource, withdrawalSource }: CnpjSourcesSectionProps) {
	const { t } = useTranslation();
	const label = (source: CnpjSource) => t(source === "UNIT" ? "admin.branding.cnpjSources.unit" : "admin.branding.cnpjSources.company");
	return (
		<CollapsibleSection
			icon={LuFileText}
			summary={t("admin.branding.cnpjSources.summary", { orders: label(orderSource), withdrawals: label(withdrawalSource) })}
			title={t("admin.branding.cnpjSources.title")}
		>
			<SourceField hint={t("admin.branding.cnpjSources.ordersHint")} label={t("admin.branding.cnpjSources.orders")} onChange={onOrderChange} value={orderSource} />
			<SourceField hint={t("admin.branding.cnpjSources.withdrawalsHint")} label={t("admin.branding.cnpjSources.withdrawals")} onChange={onWithdrawalChange} value={withdrawalSource} />
		</CollapsibleSection>
	);
}
