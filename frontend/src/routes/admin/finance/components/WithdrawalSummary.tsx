import { LuArrowUpRight } from "react-icons/lu";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/Skeleton";
import { StatCard } from "@/components/ui/StatCard";
import type { GetFinanceWallet200 } from "@/lib/api";

const formatCents = (value: number) => (value / 100).toLocaleString("pt-BR", { currency: "BRL", style: "currency" });

function feeLabel(summary: GetFinanceWallet200): string {
	const fixed = Number(summary.feePolicy.fixedCents);
	const percent = Number(summary.feePolicy.percentBasisPoints) / 100;
	return [fixed > 0 ? formatCents(fixed) : "", percent > 0 ? `${percent.toLocaleString("pt-BR")}%` : ""]
		.filter(Boolean)
		.join(" + ") || "Sem taxa";
}

interface WithdrawalSummaryProps {
	isError: boolean;
	isPending: boolean;
	onRequest: () => void;
	summary?: GetFinanceWallet200;
}

export function WithdrawalSummary({ isError, isPending, onRequest, summary }: WithdrawalSummaryProps) {
	return (
		<section className="space-y-3 rounded-brand border border-border bg-card/50 p-4">
			<div className="flex flex-wrap items-center justify-between gap-3">
				<div>
					<h2 className="font-semibold text-lg">Saldo e saques</h2>
					<p className="text-muted-foreground text-sm">Valores atualizados pela SIM INT PAY.</p>
				</div>
				<Button disabled={!summary?.configured || !summary.canRequest || isPending} onClick={onRequest} type="button">
					<LuArrowUpRight /> Solicitar saque
				</Button>
			</div>
			<div className="grid gap-3 sm:grid-cols-2">
				<StatCard label="Saldo disponível" value={isPending ? <Skeleton className="h-7 w-32" /> : formatCents(Number(summary?.availableBalanceCents ?? 0))} />
				<StatCard
					hint={isPending
						? <Skeleton className="h-3 w-36" />
						: `${Number(summary?.processingCount ?? 0)} ${Number(summary?.processingCount ?? 0) === 1 ? "saque" : "saques"}`}
					label="Em processamento"
					value={isPending ? <Skeleton className="h-7 w-32" /> : formatCents(Number(summary?.processingGrossCents ?? 0))}
				/>
			</div>
			<div className="flex flex-wrap gap-x-8 gap-y-1 text-sm">
				<span><strong>Taxa:</strong> {summary ? feeLabel(summary) : "—"}</span>
				<span><strong>Valor mínimo:</strong> {summary?.minimumCents == null ? "Sem mínimo" : formatCents(Number(summary.minimumCents))}</span>
			</div>
			{isError && <p className="text-destructive text-sm">Não foi possível consultar a carteira. O relatório abaixo continua disponível.</p>}
			{summary && !summary.configured && <p className="text-destructive text-sm">CNPJ e carteira ainda não configurados. Solicite a configuração a um super admin.</p>}
			{summary?.configured && !summary.canRequest && <p className="text-warning text-sm">Saque indisponível no momento. Consulte o saldo e tente novamente mais tarde.</p>}
		</section>
	);
}
