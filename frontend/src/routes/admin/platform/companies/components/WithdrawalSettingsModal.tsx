import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { NumericFormat, PatternFormat } from "react-number-format";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/Checkbox";
import { Input } from "@/components/ui/input";
import { Label, RequiredMark } from "@/components/ui/label";
import { Modal } from "@/components/ui/Modal";
import { TextField } from "@/components/ui/TextField";
import { closeActiveModalHistory } from "@/hooks/use-modal-history";
import { getCompaniesQueryKey, type GetCompanies200, usePatchCompaniesByCompanyIdWithdrawalSettings } from "@/lib/api";
import { showAlert, showToast } from "@/stores";

interface WithdrawalSettingsModalProps { company: GetCompanies200[number]; isOpen: boolean; onClose: () => void; }

export function WithdrawalSettingsModal({ company, isOpen, onClose }: WithdrawalSettingsModalProps) {
	const queryClient = useQueryClient();
	const [cnpj, setCnpj] = useState(company.cnpj ?? "");
	const [hasMinimum, setHasMinimum] = useState(company.withdrawalMinimumCents != null);
	const [minimumCents, setMinimumCents] = useState(Number(company.withdrawalMinimumCents ?? 0));
	const [pixKey, setPixKey] = useState(company.withdrawalPixKey ?? "");
	const update = usePatchCompaniesByCompanyIdWithdrawalSettings();

	useEffect(() => {
		if (!isOpen) return;
		setCnpj(company.cnpj ?? "");
		setHasMinimum(company.withdrawalMinimumCents != null);
		setMinimumCents(Number(company.withdrawalMinimumCents ?? 0));
		setPixKey(company.withdrawalPixKey ?? "");
	}, [company, isOpen]);

	return <Modal isOpen={isOpen} onClose={onClose} title={`Configuração financeira — ${company.name}`} urlKey="company-withdrawal-settings" urlState={company.id}>
		<div className="space-y-5">
			<Label><span>CNPJ <RequiredMark /></span><PatternFormat customInput={Input} format="##.###.###/####-##" inputMode="numeric" name="company-cnpj" onValueChange={({ value }) => setCnpj(value)} placeholder="Ex: 12.345.678/0001-90" value={cnpj} /></Label>
			<TextField autoComplete="off" label="Chave Pix padrão" name="company-withdrawal-pix-key" onValueChange={setPixKey} placeholder="Ex: financeiro@empresa.com.br" value={pixKey} />
			<label className="flex cursor-pointer items-center gap-2 text-sm"><Checkbox checked={hasMinimum} onChange={event => setHasMinimum(event.currentTarget.checked)} />Aplicar valor mínimo local</label>
			{hasMinimum && <Label><span>Valor mínimo <RequiredMark /></span><NumericFormat customInput={Input} decimalScale={2} decimalSeparator="," inputMode="decimal" name="company-withdrawal-minimum" onValueChange={({ floatValue }) => setMinimumCents(Math.round((floatValue ?? 0) * 100))} placeholder="Ex: R$ 100,00" prefix="R$ " thousandSeparator="." value={minimumCents / 100} /></Label>}
			<div className="flex justify-end gap-2"><Button onClick={() => closeActiveModalHistory()} type="button" variant="outline">Descartar</Button><Button disabled={update.isPending || cnpj.length !== 14 || (hasMinimum && minimumCents <= 0)} onClick={() => update.mutate({ companyId: company.id, data: { cnpj, minimumCents: hasMinimum ? minimumCents : null, pixKey } }, { onError: () => void showAlert("Não foi possível salvar a configuração financeira."), onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: getCompaniesQueryKey() }); showToast("Configuração financeira salva.", "positive"); closeActiveModalHistory(); } })} type="button">{update.isPending ? "Salvando..." : "Salvar"}</Button></div>
		</div>
	</Modal>;
}
