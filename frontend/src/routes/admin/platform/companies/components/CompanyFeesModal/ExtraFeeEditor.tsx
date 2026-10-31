import { useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { LuRotateCcw, LuSave, LuX } from "react-icons/lu";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/Checkbox";
import { deletePlatformFeesByFeeIdCompaniesByCompanyId, getPlatformFeesByCompanyByCompanyIdQueryKey, getPlatformFeesByFeeIdCompaniesQueryKey, putPlatformFeesByFeeIdCompaniesByCompanyId, type GetPlatformFees200, type GetPlatformFeesByFeeIdCompanies200 } from "@/lib/api";
import { formatFeeAmount } from "@/lib/platform-fees";
import { showToast } from "@/stores";
import { OverrideValueInput } from "../../../fees/components/OverrideValueInput";

type Association = GetPlatformFeesByFeeIdCompanies200[number];
type Fee = GetPlatformFees200[number];

export function ExtraFeeEditor({ companyId, fee, association }: { companyId: string; fee: Fee; association: Association }) {
	const queryClient = useQueryClient();
	const initial = () => ({ active: association.active, fixed: association.fixedOverride == null ? "" : String(Number(association.fixedOverride) / 100), percentage: association.percentageOverride == null ? "" : String(Number(association.percentageOverride) / 100) });
	const [values, setValues] = useState(initial);
	const current = useRef(values);
	const [saving, setSaving] = useState(false);
	const set = (patch: Partial<typeof values>) => { current.current = { ...current.current, ...patch }; setValues(current.current); };
	async function save(reset = false) {
		setSaving(true);
		try {
			if (reset) await deletePlatformFeesByFeeIdCompaniesByCompanyId(fee.id, companyId);
			else await putPlatformFeesByFeeIdCompaniesByCompanyId(fee.id, companyId, { active: current.current.active, fixedOverride: current.current.fixed === "" ? null : Math.round(Number(current.current.fixed) * 100), percentageOverride: current.current.percentage === "" ? null : Math.round(Number(current.current.percentage) * 100) });
			await Promise.all([queryClient.invalidateQueries({ queryKey: getPlatformFeesByFeeIdCompaniesQueryKey(fee.id) }), queryClient.invalidateQueries({ queryKey: getPlatformFeesByCompanyByCompanyIdQueryKey(companyId) })]);
			showToast(reset ? "Padrão restaurado" : "Taxa da empresa salva", "positive");
			history.back();
		} catch { showToast("Não foi possível atualizar a taxa da empresa", "negative"); }
		finally { setSaving(false); }
	}
	return <fieldset className="space-y-3 rounded-md border border-border/60 p-3" disabled={saving}>
		<div className="flex flex-wrap items-center justify-between gap-2"><div><p className="font-medium text-sm">{fee.name}</p><p className="text-muted-foreground text-xs">Padrão: {formatFeeAmount(fee.percentageValue, fee.fixedValue)} · {association.inherited ? "Herdado da plataforma" : "Personalizado para esta empresa"}</p></div><label className="flex cursor-pointer items-center gap-2 text-sm"><Checkbox checked={values.active} onChange={event => set({ active: event.currentTarget.checked })} />Associada à empresa</label></div>
		<div className="grid grid-cols-2 gap-3"><OverrideValueInput kind="percentage" label={`Percentual próprio de ${fee.name}`} name={`fee-percentage-${fee.id}`} onCommit={percentage => set({ percentage })} value={values.percentage} /><OverrideValueInput kind="fixed" label={`Valor fixo próprio de ${fee.name}`} name={`fee-fixed-${fee.id}`} onCommit={fixed => set({ fixed })} value={values.fixed} /></div>
		<p className="text-muted-foreground text-xs">Deixe os valores vazios para usar os valores padrão da plataforma.</p>
		<div className="flex flex-wrap justify-end gap-2"><Button disabled={association.inherited || saving} onClick={() => void save(true)} size="sm" type="button" variant="outline"><LuRotateCcw />Restaurar padrão</Button><Button onClick={() => history.back()} size="sm" type="button" variant="outline"><LuX />Descartar</Button><Button onClick={() => void save()} size="sm" type="button"><LuSave />Salvar</Button></div>
	</fieldset>;
}
