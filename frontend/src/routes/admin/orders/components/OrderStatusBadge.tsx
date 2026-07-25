import { useTranslation } from "react-i18next";
import { LuInfo } from "react-icons/lu";
import { Tooltip } from "@/components/ui/Tooltip";

const STATUS_CLASS_NAMES: Record<string, string> = {
	awaiting_payment: "border-amber-200 bg-amber-50 text-amber-800",
	cancelado: "border-red-200 bg-red-50 text-red-700",
	em_preparo: "border-sky-200 bg-sky-50 text-sky-800",
	entregue: "border-emerald-200 bg-emerald-50 text-emerald-800",
	problema: "border-rose-300 bg-rose-50 text-rose-800",
	pronto: "border-violet-200 bg-violet-50 text-violet-800",
	recebido: "border-blue-200 bg-blue-50 text-blue-800",
	retirado: "border-slate-200 bg-slate-50 text-slate-700",
	saiu_para_entrega: "border-orange-200 bg-orange-50 text-orange-800",
};

const STATUS_DESCRIPTIONS: Record<string, string> = {
	awaiting_payment:
		"Pedido criado, mas ainda sem pagamento confirmado. Muda automaticamente quando o pagamento for aprovado.",
	cancelado: "Pedido encerrado sem seguir para preparo, retirada ou entrega.",
	em_preparo: "Pedido aceito pela unidade e em produção.",
	entregue: "Pedido de entrega finalizado: chegou ao cliente.",
	problema: "Pedido com pendência operacional que exige solução.",
	pronto: "Pedido finalizado pela cozinha, aguardando retirada ou saída para entrega.",
	recebido: "Pagamento confirmado e pedido liberado para a operação.",
	retirado: "Pedido de retirada finalizado: o cliente retirou na unidade.",
	saiu_para_entrega: "Pedido de entrega atribuído e em rota com o entregador.",
};

interface OrderStatusBadgeProps {
	showHelp?: boolean;
	status: string;
}

export function OrderStatusBadge({ showHelp = false, status }: OrderStatusBadgeProps) {
	const { t } = useTranslation();
	const description = STATUS_DESCRIPTIONS[status];

	return (
		<span
			className={`inline-flex max-w-full items-center gap-1 rounded-full border px-2 py-0.5 font-semibold text-xs ${
				STATUS_CLASS_NAMES[status] ?? "border-border bg-muted text-muted-foreground"
			}`}
		>
			<span className="truncate">{t(`admin.orders.status.${status}`, { defaultValue: status })}</span>
			{showHelp && description && (
				<Tooltip content={t(`admin.orders.statusHelp.${status}`, { defaultValue: description })}>
					<span className="grid size-4 shrink-0 place-items-center rounded-full border border-current/20 bg-white/40 text-current/80">
						<LuInfo aria-hidden className="size-3" />
					</span>
				</Tooltip>
			)}
		</span>
	);
}
