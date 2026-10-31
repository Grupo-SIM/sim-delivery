import { useTranslation } from "react-i18next";
import { ErrorState } from "@/components/ui/ErrorState";
import { Skeleton } from "@/components/ui/Skeleton";
import { useGetPlatformFees } from "@/lib/api";
import { ExtraFeeRow } from "./ExtraFeeRow";
import type { CompanyFees, ExtraFeeDraft } from "./types";

interface ExtraFeesListProps {
	companyId: string;
	drafts: Record<string, ExtraFeeDraft>;
	mode: CompanyFees["mode"];
	onDraftChange: (feeId: string, draft: ExtraFeeDraft) => void;
}

export function ExtraFeesList({ companyId, drafts, mode, onDraftChange }: ExtraFeesListProps) {
	const { t } = useTranslation();
	const query = useGetPlatformFees();
	if (query.isPending) return <div className="space-y-3"><Skeleton className="h-40 w-full" /><Skeleton className="h-40 w-full" /></div>;
	if (query.isError) return <ErrorState title={t("admin.companies.fees.loadError")} />;
	return <div className="space-y-3">
		{mode === "SIMINTPAY_ONLY" && <p className="text-muted-foreground text-sm">{t("admin.companies.fees.extras.disabled")}</p>}
		{query.data.length === 0 ? <p className="text-muted-foreground text-sm">{t("admin.companies.fees.extras.empty")}</p> : query.data.map(fee => <ExtraFeeRow companyId={companyId} draft={drafts[fee.id]} fee={fee} key={fee.id} onDraftChange={draft => onDraftChange(fee.id, draft)} />)}
	</div>;
}
