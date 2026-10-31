import { useRef, useState } from "react";
import { LuRotateCcw, LuSave, LuX } from "react-icons/lu";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/Checkbox";
import { formatFeeAmount } from "@/lib/platform-fees";
import { showToast } from "@/stores";
import { OverrideValueInput } from "./OverrideValueInput";
import type { CompanyAdditiveFee, ExtraFeeDraft } from "./types";

export function ExtraFeeEditor({ draft, fee, onApply, onClose }: { draft?: ExtraFeeDraft; fee: CompanyAdditiveFee; onApply: (draft: ExtraFeeDraft) => void; onClose: () => void }) {
	const initial = (): ExtraFeeDraft => draft ?? { active: fee.associated, fixed: fee.fixedOverride == null ? "" : String(Number(fee.fixedOverride) / 100), percentage: fee.percentageOverride == null ? "" : String(Number(fee.percentageOverride) / 100), reset: false };
	const inherited = fee.percentageOverride == null && fee.fixedOverride == null;
	const [values, setValues] = useState(initial);
	const current = useRef(values);
	const set = (patch: Partial<ExtraFeeDraft>) => { current.current = { ...current.current, ...patch }; setValues(current.current); };
	function apply(next: ExtraFeeDraft) {
		onApply(next);
		showToast("Alteração aplicada. Salve a empresa para confirmar.", "info");
		onClose();
	}
	return <fieldset className="space-y-3 rounded-md border border-border/60 p-3">
		<div className="flex flex-wrap items-center justify-between gap-2"><div><p className="font-medium text-sm">{fee.name}</p><p className="text-muted-foreground text-xs">Padrão: {formatFeeAmount(fee.percentageValue, fee.fixedValue)} · {inherited ? "Herdado da plataforma" : "Personalizado para esta empresa"}</p></div><label className="flex cursor-pointer items-center gap-2 text-sm"><Checkbox checked={values.active} onChange={event => set({ active: event.currentTarget.checked })} />Associada à empresa</label></div>
		<div className="grid grid-cols-2 gap-3"><OverrideValueInput defaultValue={Number(fee.percentageValue) / 100} kind="percentage" label={`Percentual próprio de ${fee.name}`} name={`fee-percentage-${fee.id}`} onCommit={percentage => set({ percentage })} value={values.percentage} /><OverrideValueInput defaultValue={Number(fee.fixedValue) / 100} kind="fixed" label={`Valor fixo próprio de ${fee.name}`} name={`fee-fixed-${fee.id}`} onCommit={fixed => set({ fixed })} value={values.fixed} /></div>
		<p className="text-muted-foreground text-xs">Deixe os valores vazios para usar os valores padrão da plataforma.</p>
		<div className="flex flex-wrap justify-end gap-2"><Button disabled={inherited && !draft} onClick={() => apply({ active: true, fixed: "", percentage: "", reset: true })} size="sm" type="button" variant="outline"><LuRotateCcw />Restaurar padrão</Button><Button onClick={() => history.back()} size="sm" type="button" variant="outline"><LuX />Descartar</Button><Button onClick={() => apply({ ...current.current, reset: false })} size="sm" type="button"><LuSave />Salvar</Button></div>
	</fieldset>;
}
