import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { NumericFormat } from "react-number-format";
import { Button } from "@/components/ui/button";
import { CustomSelect } from "@/components/ui/CustomSelect";
import { Input } from "@/components/ui/input";
import { Label, RequiredMark } from "@/components/ui/label";
import { Modal } from "@/components/ui/Modal";
import { TextField } from "@/components/ui/TextField";
import { getFinanceWalletQueryKey, getFinanceWithdrawalsQueryKey, usePostFinanceWithdrawals, usePostFinanceWithdrawalsQuote, type GetFinanceWallet200 } from "@/lib/api";
import { closeActiveModalHistory } from "@/hooks/use-modal-history";
import { showAlert, showToast } from "@/stores";

const formatDocument = (value: string) => value.length === 14
	? value.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5")
	: value.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, "$1.$2.$3-$4");

const formatCents = (value: number) => (value / 100).toLocaleString("pt-BR", { currency: "BRL", style: "currency" });

interface WithdrawalRequestModalProps {
	isOpen: boolean;
	onClose: () => void;
	summary: GetFinanceWallet200;
}

function getQuoteErrorMessage(error: unknown) {
	if (typeof error !== "object" || error === null || !("data" in error)) return "Não foi possível calcular a cotação. Revise o valor e tente novamente.";

	const data = error.data;
	if (typeof data !== "object" || data === null || !("description" in data) || typeof data.description !== "string" || !data.description.trim()) return "Não foi possível calcular a cotação. Revise o valor e tente novamente.";

	return data.description;
}

export function WithdrawalRequestModal({ isOpen, onClose, summary }: WithdrawalRequestModalProps) {
	const queryClient = useQueryClient();
	const [amountCents, setAmountCents] = useState(0);
	const documents = summary.documents;
	const [documentIndex, setDocumentIndex] = useState(0);
	const selectedDocument = documents[documentIndex] ?? null;
	const [pixKey, setPixKey] = useState(documents[0]?.cnpj ?? summary.pixKey ?? "");
	const quote = usePostFinanceWithdrawalsQuote();
	const request = usePostFinanceWithdrawals();

	useEffect(() => {
		if (!isOpen) return;
		setDocumentIndex(0);
		setPixKey(documents[0]?.cnpj ?? summary.pixKey ?? "");
		setAmountCents(0);
		quote.reset();
	}, [isOpen, summary.pixKey, documents]);

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
				{documents.length > 1 && (
					<div className="space-y-2">
						<span className="font-medium text-sm">CNPJ do saque</span>
						<CustomSelect
							ariaLabel="CNPJ do saque"
							onChange={value => {
								const index = Number(value);
								setDocumentIndex(index);
								setPixKey(documents[index]?.cnpj ?? "");
							}}
							options={documents.map((document, index) => ({ label: `${document.label} — ${formatDocument(document.cnpj)}`, value: String(index) }))}
							value={String(documentIndex)}
						/>
					</div>
				)}
				<TextField autoComplete="off" label={<span>Chave Pix <RequiredMark /></span>} name="withdrawal-pix-key" onValueChange={setPixKey} placeholder="Ex: financeiro@empresa.com.br" required value={pixKey} />
				<div className="grid gap-2 rounded-md border border-border bg-muted/30 p-4 text-sm sm:grid-cols-3">
					<div><p className="text-muted-foreground">Bruto</p><strong>{formatCents(amountCents)}</strong></div>
					<div><p className="text-muted-foreground">Taxa</p><strong>{quote.data ? formatCents(Number(quote.data.feeCents)) : "—"}</strong></div>
					<div><p className="text-muted-foreground">Líquido</p><strong>{quote.data ? formatCents(Number(quote.data.netAmountCents)) : "—"}</strong></div>
				</div>
				{belowMinimum && <p className="text-destructive text-sm">Mínimo: {formatCents(Number(summary.minimumCents))}.</p>}
				{quote.isError && <p className="text-destructive text-sm">{getQuoteErrorMessage(quote.error)}</p>}
				<div className="flex justify-end gap-2">
					<Button onClick={() => closeActiveModalHistory()} type="button" variant="outline">Descartar</Button>
					<Button disabled={!valid || request.isPending || quote.isPending} onClick={() => request.mutate({ data: { grossAmountCents: amountCents, pixKey: pixKey.trim(), unitId: selectedDocument?.cnpj === pixKey.trim() ? selectedDocument.unitId : null } }, { onError: () => void showAlert("Não foi possível solicitar o saque."), onSuccess: async () => { await Promise.all([queryClient.invalidateQueries({ queryKey: getFinanceWalletQueryKey() }), queryClient.invalidateQueries({ queryKey: getFinanceWithdrawalsQueryKey() })]); showToast("Saque solicitado com sucesso.", "positive"); closeActiveModalHistory(); } })} type="button">{request.isPending ? "Solicitando..." : "Confirmar saque"}</Button>
				</div>
			</div>
		</Modal>
	);
}
