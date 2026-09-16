import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/DataTable";
import { EmptyState } from "@/components/ui/EmptyState";
import type { GetFinanceWithdrawals200 } from "@/lib/api";
import { useTranslation } from "react-i18next";
import { WithdrawalHistorySkeleton } from "./WithdrawalHistorySkeleton";

const formatCents = (value: number) => (value / 100).toLocaleString("pt-BR", { currency: "BRL", style: "currency" });
const maskPix = (value: string) => value.length <= 6 ? "••••••" : `${value.slice(0, 3)}••••${value.slice(-3)}`;

interface WithdrawalHistoryProps { data?: GetFinanceWithdrawals200; isError: boolean; isPending: boolean; onPageChange: (page: number) => void; }

export function WithdrawalHistory({ data, isError, isPending, onPageChange }: WithdrawalHistoryProps) {
	const { t } = useTranslation();
	if (isPending) return <WithdrawalHistorySkeleton />;
	if (isError) return <EmptyState title="Não foi possível carregar o histórico de saques." />;
	if (!data?.items.length) return <EmptyState title="Nenhum saque solicitado." />;
	const page = Number(data.meta.page);
	const totalPages = Number(data.meta.totalPages);
	return (
		<section className="space-y-3">
			<h2 className="font-semibold text-lg">Histórico de saques</h2>
			<DataTable>
				<thead><tr className="border-border border-b text-left text-muted-foreground"><th className="px-4 py-3">Data</th><th className="px-4 py-3 text-right">Bruto</th><th className="px-4 py-3 text-right">Taxa</th><th className="px-4 py-3 text-right">Líquido</th><th className="px-4 py-3">Chave Pix</th><th className="px-4 py-3">Status</th></tr></thead>
				<tbody>{data.items.map(item => <tr className="border-border/60 border-b last:border-0" key={item.id}><td className="px-4 py-3">{new Date(item.createdAt).toLocaleDateString("pt-BR")}</td><td className="px-4 py-3 text-right font-medium">{formatCents(Number(item.grossAmountCents))}</td><td className="px-4 py-3 text-right">{formatCents(Number(item.feeCents))}</td><td className="px-4 py-3 text-right">{formatCents(Number(item.netAmountCents))}</td><td className="px-4 py-3">{maskPix(item.pixKey)}</td><td className="px-4 py-3"><span className="rounded-full border border-border px-2 py-1 text-xs">{t(`admin.withdrawals.status.${item.status}`, { defaultValue: item.status })}</span>{item.rejectionReason && <p className="mt-1 max-w-56 text-destructive text-xs">{item.rejectionReason}</p>}</td></tr>)}</tbody>
			</DataTable>
			<div className="flex items-center justify-end gap-3"><Button disabled={page <= 1} onClick={() => onPageChange(page - 1)} type="button" variant="outline">Anterior</Button><span className="text-muted-foreground text-sm">{page} / {totalPages}</span><Button disabled={page >= totalPages} onClick={() => onPageChange(page + 1)} type="button" variant="outline">Próxima</Button></div>
		</section>
	);
}
