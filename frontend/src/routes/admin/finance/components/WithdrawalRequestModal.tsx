import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { NumericFormat } from "react-number-format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label, RequiredMark } from "@/components/ui/label";
import { Modal } from "@/components/ui/Modal";
import { TextField } from "@/components/ui/TextField";
import { getFinanceWalletQueryKey, getFinanceWithdrawalsQueryKey, usePostFinanceWithdrawals, usePostFinanceWithdrawalsQuote, type GetFinanceWallet200 } from "@/lib/api";
import { closeActiveModalHistory } from "@/hooks/use-modal-history";
import { showAlert, showToast } from "@/stores";

const formatCents = (value: number) => (value / 100).toLocaleString("pt-BR", { currency: "BRL", style: "currency" });

interface WithdrawalRequestModalProps {
	isOpen: boolean;
	onClose: () => void;
	summary: GetFinanceWallet200;
}

export function WithdrawalRequestModal({ isOpen, onClose, summary }: WithdrawalRequestModalProps) {
	const queryClient = useQueryClient();
	const [amountCents, setAmountCents] = useState(0);
	const [pixKey, setPixKey] = useState(summary.pixKey ?? "");
	const quote = usePostFinanceWithdrawalsQuote();
	const request = usePostFinanceWithdrawals();

	useEffect(() => {
		if (!isOpen) return;
		setPixKey(summary.pixKey ?? "");
		setAmountCents(0);
		quote.reset();
	}, [isOpen, summary.pixKey]);

	useEffect(() => {
		if (!isOpen || amountCents <= 0) {
			quote.reset();
			return;
		}
		const timer = window.setTimeout(() => quote.mutate({ data: { grossAmountCents: amountCents } }), 250);
		return () => window.clearTimeout(timer);
	}, [amountCents, isOpen]);

	const belowMinimum = summary.minimumCents != null && amountCents < Number(summary.minimumCents);
	const quoteReady = Number(quote.data?.grossAmountCents) === amountCents;
	const valid = amountCents > 0 && amountCents <= Number(summary.availableBalanceCents) && !belowMinimum && Boolean(pixKey.trim()) && quoteReady;

	return (
		<Modal isOpen={isOpen} onClose={onClose} title="Solicitar saque" urlKey="withdrawal-request">
			<div className="space-y-5">
				<Label>
					<span>Valor bruto <RequiredMark /></span>
					<NumericFormat customInput={Input} decimalScale={2} decimalSeparator="," inputMode="decimal" name="withdrawal-amount" onValueChange={({ floatValue }) => setAmountCents(Math.round((floatValue ?? 0) * 100))} placeholder="Ex: R$ 500,00" prefix="R$ " thousandSeparator="." value={amountCents > 0 ? amountCents / 100 : ""} />
				</Label>
				<TextField autoComplete="off" label={<span>Chave Pix <RequiredMark /></span>} name="withdrawal-pix-key" onValueChange={setPixKey} placeholder="Ex: financeiro@empresa.com.br" required value={pixKey} />
				<div className="grid gap-2 rounded-md border border-border bg-muted/30 p-4 text-sm sm:grid-cols-3">
					<div><p className="text-muted-foreground">Bruto</p><strong>{formatCents(amountCents)}</strong></div>
					<div><p className="text-muted-foreground">Taxa</p><strong>{quote.data ? formatCents(Number(quote.data.feeCents)) : "—"}</strong></div>
					<div><p className="text-muted-foreground">Líquido</p><strong>{quote.data ? formatCents(Number(quote.data.netAmountCents)) : "—"}</strong></div>
				</div>
				{belowMinimum && <p className="text-destructive text-sm">Mínimo: {formatCents(Number(summary.minimumCents))}.</p>}
				{quote.isError && <p className="text-destructive text-sm">Não foi possível calcular a cotação. Revise o valor e tente novamente.</p>}
				<div className="flex justify-end gap-2">
					<Button onClick={() => closeActiveModalHistory()} type="button" variant="outline">Descartar</Button>
					<Button disabled={!valid || request.isPending || quote.isPending} onClick={() => request.mutate({ data: { grossAmountCents: amountCents, pixKey: pixKey.trim() } }, { onError: () => void showAlert("Não foi possível solicitar o saque."), onSuccess: async () => { await Promise.all([queryClient.invalidateQueries({ queryKey: getFinanceWalletQueryKey() }), queryClient.invalidateQueries({ queryKey: getFinanceWithdrawalsQueryKey() })]); showToast("Saque solicitado com sucesso.", "positive"); closeActiveModalHistory(); } })} type="button">{request.isPending ? "Solicitando..." : "Confirmar saque"}</Button>
				</div>
			</div>
		</Modal>
	);
}
