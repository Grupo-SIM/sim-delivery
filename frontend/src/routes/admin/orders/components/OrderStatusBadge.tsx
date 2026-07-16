import { useTranslation } from "react-i18next";

const STATUS_CLASS_NAMES: Record<string, string> = {
	awaiting_payment: "border-amber-200 bg-amber-50 text-amber-800",
	cancelado: "border-red-200 bg-red-50 text-red-700",
	em_preparo: "border-sky-200 bg-sky-50 text-sky-800",
	entregue: "border-emerald-200 bg-emerald-50 text-emerald-800",
	pronto: "border-violet-200 bg-violet-50 text-violet-800",
	recebido: "border-blue-200 bg-blue-50 text-blue-800",
	retirado: "border-slate-200 bg-slate-50 text-slate-700",
	saiu_para_entrega: "border-orange-200 bg-orange-50 text-orange-800",
};

interface OrderStatusBadgeProps {
	status: string;
}

export function OrderStatusBadge({ status }: OrderStatusBadgeProps) {
	const { t } = useTranslation();

	return (
		<span
			className={`inline-flex max-w-full items-center rounded-full border px-2 py-0.5 font-semibold text-xs ${
				STATUS_CLASS_NAMES[status] ?? "border-border bg-muted text-muted-foreground"
			}`}
		>
			<span className="truncate">{t(`admin.orders.status.${status}`, { defaultValue: status })}</span>
		</span>
	);
}
