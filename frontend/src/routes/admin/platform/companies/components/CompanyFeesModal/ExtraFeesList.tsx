import { useState } from "react";
import { useTranslation } from "react-i18next";
import { LuPlus } from "react-icons/lu";
import { Button } from "@/components/ui/button";
import { CustomSelect } from "@/components/ui/CustomSelect";
import { showToast } from "@/stores";
import { ExtraFeeRow } from "./ExtraFeeRow";
import { useExtraFeeEntries } from "./use-extra-fee-entries";
import type { CompanyAdditiveFee, CompanyFees, ExtraFeeDraft } from "./types";

interface ExtraFeesListProps {
	additiveFees: CompanyAdditiveFee[];
	companyId: string;
	drafts: Record<string, ExtraFeeDraft>;
	mode: CompanyFees["mode"];
	onDraftChange: (feeId: string, draft: ExtraFeeDraft) => void;
}

export function ExtraFeesList({ additiveFees, companyId, drafts, mode, onDraftChange }: ExtraFeesListProps) {
	const { t } = useTranslation();
	const [selectedId, setSelectedId] = useState("");
	const entries = useExtraFeeEntries(additiveFees, drafts);

	const associated = entries.filter(entry => entry.active);
	const available = entries.filter(entry => !entry.active && entry.fee.active);
	const selected = available.find(entry => entry.fee.id === selectedId);

	function associate() {
		if (!selected) return;
		const { draft, fee } = selected;
		onDraftChange(fee.id, {
			active: true,
			fixed: draft ? draft.fixed : fee.fixedOverride == null ? "" : String(Number(fee.fixedOverride) / 100),
			percentage: draft ? draft.percentage : fee.percentageOverride == null ? "" : String(Number(fee.percentageOverride) / 100),
			reset: false,
		});
		setSelectedId("");
		showToast(`${fee.name} associada`, "positive");
	}

	return <div className="space-y-3">
		{mode === "SIMINTPAY_ONLY" && <p className="text-muted-foreground text-sm">{t("admin.companies.fees.extras.disabled")}</p>}
		{associated.length === 0 && <p className="text-muted-foreground text-sm">{t("admin.companies.fees.extras.empty")}</p>}
		{associated.map(({ draft, fee }) => <ExtraFeeRow companyId={companyId} draft={draft} fee={fee} key={fee.id} onDraftChange={next => onDraftChange(fee.id, next)} />)}
		{available.length > 0 && <div className="flex items-center gap-2">
			<CustomSelect ariaLabel="Taxa a associar" className="min-w-0 flex-1" onChange={setSelectedId} options={available.map(entry => ({ label: entry.fee.name, value: entry.fee.id }))} placeholder="Selecione uma taxa" value={selectedId} />
			<Button disabled={!selected} onClick={associate} type="button" variant="outline"><LuPlus />Associar taxa</Button>
		</div>}
	</div>;
}
