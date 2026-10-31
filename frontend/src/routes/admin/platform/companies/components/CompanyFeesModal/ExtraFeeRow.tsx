import { useState } from "react";
import { useTranslation } from "react-i18next";
import { LuPencil } from "react-icons/lu";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/Modal";
import { Tooltip } from "@/components/ui/Tooltip";
import { formatFeeAmount } from "@/lib/platform-fees";
import { ExtraFeeEditor } from "./ExtraFeeEditor";
import { type CompanyAdditiveFee, type ExtraFeeDraft, percentToBasisPoints, reaisToNullableCents } from "./types";

export function ExtraFeeRow({ companyId, draft, fee, onDraftChange }: { companyId: string; draft?: ExtraFeeDraft; fee: CompanyAdditiveFee; onDraftChange: (draft: ExtraFeeDraft) => void }) {
	const { t } = useTranslation();
	const [editing, setEditing] = useState(false);
	const percentage = draft ? (draft.reset ? null : percentToBasisPoints(draft.percentage)) : fee.percentageOverride;
	const fixed = draft ? (draft.reset ? null : reaisToNullableCents(draft.fixed)) : fee.fixedOverride;
	const active = draft ? draft.active : fee.associated;
	return <>
		<div className="flex items-center justify-between gap-3 rounded-md border border-border/60 px-3 py-2 text-sm">
			<div className="min-w-0"><p className="font-medium">{fee.name}</p><p className="text-muted-foreground text-xs">{t(`admin.companies.fees.scope.${fee.applicationScope}`, { defaultValue: fee.applicationScope })} · {formatFeeAmount(percentage ?? fee.percentageValue, fixed ?? fee.fixedValue)} · {active ? "Associada" : "Não associada"}</p></div>
			<Tooltip content="Editar associação"><Button aria-label={`Editar associação de ${fee.name}`} onClick={() => setEditing(true)} size="icon" type="button" variant="outline"><LuPencil /></Button></Tooltip>
		</div>
		<Modal isOpen={editing} onClose={() => setEditing(false)} title={`Taxa da empresa · ${fee.name}`} urlKey="company-extra-fee" urlState={`${companyId}:${fee.id}`}>
			{editing && <ExtraFeeEditor draft={draft} fee={fee} onApply={onDraftChange} onClose={() => setEditing(false)} />}
		</Modal>
	</>;
}
