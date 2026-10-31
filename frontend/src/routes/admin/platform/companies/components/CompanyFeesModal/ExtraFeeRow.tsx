import { useState } from "react";
import { useTranslation } from "react-i18next";
import { LuPencil } from "react-icons/lu";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/ErrorState";
import { Modal } from "@/components/ui/Modal";
import { Skeleton } from "@/components/ui/Skeleton";
import { Tooltip } from "@/components/ui/Tooltip";
import { useGetPlatformFeesByFeeIdCompanies, type GetPlatformFees200 } from "@/lib/api";
import { formatFeeAmount } from "@/lib/platform-fees";
import { ExtraFeeEditor } from "./ExtraFeeEditor";
type Fee = GetPlatformFees200[number];

export function ExtraFeeRow({ companyId, fee }: { companyId: string; fee: Fee }) {
	const { t } = useTranslation();
	const [editing, setEditing] = useState(false);
	const query = useGetPlatformFeesByFeeIdCompanies(fee.id);
	if (query.isPending) return <Skeleton className="h-16 w-full" />;
	const association = query.data?.find(company => company.companyId === companyId);
	if (query.isError || !association) return <ErrorState title={`Não foi possível carregar ${fee.name}`} />;
	return <>
		<div className="flex items-center justify-between gap-3 rounded-md border border-border/60 px-3 py-2 text-sm">
			<div className="min-w-0"><p className="font-medium">{fee.name}</p><p className="text-muted-foreground text-xs">{t(`admin.companies.fees.scope.${fee.applicationScope}`, { defaultValue: fee.applicationScope })} · {formatFeeAmount(association.percentageOverride ?? fee.percentageValue, association.fixedOverride ?? fee.fixedValue)} · {association.active ? "Associada" : "Não associada"}</p></div>
			<Tooltip content="Editar associação"><Button aria-label={`Editar associação de ${fee.name}`} onClick={() => setEditing(true)} size="icon" type="button" variant="outline"><LuPencil /></Button></Tooltip>
		</div>
		<Modal isOpen={editing} onClose={() => setEditing(false)} title={`Taxa da empresa · ${fee.name}`} urlKey="company-extra-fee" urlState={`${companyId}:${fee.id}`}>
			{editing && <ExtraFeeEditor association={association} companyId={companyId} fee={fee} />}
		</Modal>
	</>;
}
