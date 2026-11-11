import type { Row, Sheet, SheetData } from "write-excel-file/node";
import type { BusinessMetricsReturn, FinancialAnalyticsReturn } from "../dtos";
import { getOrdersByPeriod } from "./ordersByPeriod";
import { COMPLETED } from "./orderStatus";
import type { ReportGroupBy } from "./reportPeriod";

/** Brazilian Real, so totals stay summable in the spreadsheet instead of being pre-formatted text. */
const CURRENCY_FORMAT = "[$R$-416]#,##0.00";
const DATE_FORMAT = "dd/mm/yyyy hh:mm";
const DAY_FORMAT = "dd/mm/yyyy";

const GROUP_BY_SHEETS: { groupBy: ReportGroupBy; sheet: string }[] = [
	{ groupBy: "hourOfDay", sheet: "Por hora do dia" },
	{ groupBy: "dayOfWeek", sheet: "Por dia da semana" },
	{ groupBy: "dayOfMonth", sheet: "Por dia do mês" },
	{ groupBy: "month", sheet: "Por mês" },
	{ groupBy: "quarter", sheet: "Por trimestre" },
	{ groupBy: "year", sheet: "Por ano" },
];

const PAYMENT_METHOD_LABELS: Record<string, string> = {
	credit_card: "Cartão de crédito",
	pix: "PIX",
	unreported: "Não informado",
};
const CANCEL_STAGE_LABELS: Record<string, string> = {
	awaiting_payment: "Aguardando pagamento",
	em_preparo: "Em preparo",
	entregue: "Entregue",
	pronto: "Pronto",
	recebido: "Recebido",
	retirado: "Retirado",
	saiu_para_entrega: "Saiu para entrega",
};
const DELIVERY_METHOD_LABELS: Record<string, string> = { delivery: "Entrega", pickup: "Retirada" };

export interface ExportableOrder {
	coupon: { code: string } | null;
	createdAt: Date;
	customer: { phone: string | null; user: { name: string | null } };
	deliveryFee: number;
	deliveryMethod: string;
	discountCents: number;
	displayNumber: number;
	feeTotalCents?: number;
	items: { optionSnapshots: { optionName: string }[]; productName: string; quantity: number }[];
	status: string;
	subtotal: number;
	total: number;
	unit: { name: string };
}

export interface ReportSheetsInput {
	business?: BusinessMetricsReturn;
	financial?: FinancialAnalyticsReturn;
	analytics: {
		deliveryRadiusPerformance: {
			deliveryFee: number;
			orderCount: number;
			radiusKm: number | null;
			totalRevenue: number;
			unitName: string;
		}[];
	};
	bestSellers: { productName: string; totalQuantity: number; totalRevenue: number }[];
	now: Date;
	orders: ExportableOrder[];
	since: Date | undefined;
	summary: { averageOrderValue: number; orderCount: number; totalRevenue: number };
	until: Date | undefined;
}

function header(...labels: string[]): Row {
	return labels.map(value => ({ fontWeight: "bold" as const, value }));
}

function money(cents: number) {
	return { format: CURRENCY_FORMAT, type: Number, value: cents / 100 };
}

function buildSummarySheet(input: Pick<ReportSheetsInput, "since" | "summary" | "until">): SheetData {
	const { since, summary, until } = input;
	// `until` is exclusive (see getReportDateRange), so show the last day actually included.
	const lastDay = until ? new Date(until.getTime() - 86_400_000) : undefined;

	return [
		header("Indicador", "Valor"),
		["Início do período", since ? { format: DAY_FORMAT, type: Date, value: since } : "Todo o histórico"],
		["Fim do período", lastDay ? { format: DAY_FORMAT, type: Date, value: lastDay } : "Até hoje"],
		["Receita total", money(summary.totalRevenue)],
		["Pedidos concluídos", summary.orderCount],
		["Ticket médio", money(summary.averageOrderValue)],
	];
}

function percent(value: number | null, digits = 1) {
	return value === null ? "—" : `${value.toFixed(digits)}%`;
}

function minutes(value: number | null) {
	return value === null ? "—" : `${Math.round(value)} min`;
}

function section(title: string, ...rows: Row[]): SheetData {
	return [[], [{ fontWeight: "bold" as const, value: title }], ...rows];
}

function buildFinancialSheet(financial: FinancialAnalyticsReturn, business?: BusinessMetricsReturn): SheetData {
	const { cancellation, distribution, paymentAbandonment, summary } = financial;
	const distributionRows = (rows: FinancialAnalyticsReturn["distribution"]["payment"], labels: Record<string, string>) =>
		rows.map((row): Row => [labels[row.method] ?? row.method, row.orderCount, money(row.netRevenueCents)]);
	return [
		header("Indicador", "Valor"),
		["Faturamento bruto", money(summary.grossRevenueCents)],
		["Descontos", money(summary.discountCents)],
		["Cashback resgatado", money(summary.cashbackRedeemedCents)],
		["Frete", money(summary.deliveryFeeCents)],
		["Receita líquida", money(summary.netRevenueCents)],
		["Pedidos concluídos", summary.orderCount],
		["Ticket médio", money(summary.averageOrderValue)],
		["Custos conhecidos", money(summary.knownCostCents)],
		["Lucro bruto parcial", money(summary.grossProfitCents)],
		["Margem bruta parcial", percent(summary.grossMarginPercent, 2)],
		["Receita sem custo conhecido", money(summary.unknownCostRevenueCents)],
		...section(
			"Receita por forma de pagamento",
			header("Método", "Pedidos", "Receita líquida"),
			...distributionRows(distribution.payment, PAYMENT_METHOD_LABELS),
		),
		...section(
			"Receita por modalidade de entrega",
			header("Método", "Pedidos", "Receita líquida"),
			...distributionRows(distribution.delivery, DELIVERY_METHOD_LABELS),
		),
		...section(
			"Cancelamentos",
			["Taxa de cancelamento", percent(cancellation.cancelRatePercent)],
			["Pedidos cancelados", cancellation.canceledOrderCount],
			["Receita perdida", money(cancellation.lostRevenueCents)],
			["Ticket médio cancelado", money(cancellation.averageCanceledTicket)],
			["Insumo desperdiçado", money(cancellation.wastedCostCents)],
			["Estorno pendente", money(cancellation.pendingRefundCents)],
			["Valor estornado", money(cancellation.refundedCents)],
		),
		...section(
			"Cancelamentos por etapa",
			header("Etapa", "Pedidos", "Receita perdida"),
			...cancellation.byStage.map(
				(row): Row => [CANCEL_STAGE_LABELS[row.stage] ?? row.stage, row.orderCount, money(row.lostRevenueCents)],
			),
		),
		...section(
			"Abandono no pagamento",
			["Pedidos não pagos", paymentAbandonment.abandonedOrderCount],
			["Valor não convertido", money(paymentAbandonment.abandonedValueCents)],
			["Ticket médio não convertido", money(paymentAbandonment.averageAbandonedTicket)],
		),
		...(business ? buildBusinessSections(business) : []),
	];
}

function buildBusinessSections({ customers, discounts, operations, units }: BusinessMetricsReturn): SheetData {
	return [
		...section(
			"Clientes",
			["Clientes novos", customers.newCustomers],
			["Clientes recorrentes", customers.returningCustomers],
			["Taxa de recompra", percent(customers.repeatRatePercent)],
			["Pedidos por cliente", customers.ordersPerCustomer.toFixed(1)],
			["Receita por cliente", money(customers.revenuePerCustomer)],
		),
		...section(
			"Descontos e cupons",
			["Descontos concedidos", money(discounts.discountCents)],
			["Cashback resgatado", money(discounts.cashbackRedeemedCents)],
			["Pontos de fidelidade resgatados", discounts.loyaltyPointsRedeemed],
			["% do faturamento bruto", percent(discounts.discountShareOfGrossPercent)],
		),
		...section(
			"Cupons mais usados",
			header("Cupom", "Pedidos", "Desconto concedido"),
			...discounts.topCoupons.map((row): Row => [row.code, row.orderCount, money(row.discountCents)]),
		),
		...section(
			"Operação",
			["Tempo médio de preparo", minutes(operations.averagePrepMinutes)],
			["Tempo médio de entrega", minutes(operations.averageDeliveryMinutes)],
			["Tempo médio total", minutes(operations.averageFulfillmentMinutes)],
			["Taxa de pedidos com problema", percent(operations.problemRatePercent)],
		),
		...section(
			"Pedidos por hora do dia",
			header("Hora", "Pedidos"),
			...operations.peaks.byHourOfDay.map((row): Row => [row.label, row.orderCount]),
		),
		...section(
			"Pedidos por dia da semana",
			header("Dia", "Pedidos"),
			...operations.peaks.byDayOfWeek.map((row): Row => [row.label, row.orderCount]),
		),
		...section(
			"Comparativo por unidade",
			header("Unidade", "Pedidos", "Receita", "Ticket médio", "Margem bruta", "Cancelamento"),
			...units.map(
				(row): Row => [
					row.unitName,
					row.orderCount,
					money(row.netRevenueCents),
					money(row.averageOrderValue),
					row.grossMarginPercent === null ? "Sem custo conhecido" : percent(row.grossMarginPercent),
					percent(row.cancelRatePercent),
				],
			),
		),
	];
}

function buildBestSellersSheet(bestSellers: ReportSheetsInput["bestSellers"]): SheetData {
	return [
		header("Produto", "Quantidade", "Receita"),
		...bestSellers.map((item): Row => [item.productName, item.totalQuantity, money(item.totalRevenue)]),
	];
}

function buildOrdersByPeriodSheet(
	orders: { createdAt: Date }[],
	groupBy: ReportGroupBy,
	since: Date | undefined,
	now: Date,
): SheetData {
	return [
		header("Período", "Pedidos"),
		...getOrdersByPeriod(orders, groupBy, since, now).map((item): Row => [item.label, item.orderCount]),
	];
}

function buildDeliveryRadiusSheet(
	rows: ReportSheetsInput["analytics"]["deliveryRadiusPerformance"],
): SheetData {
	return [
		header("Unidade", "Raio (km)", "Taxa de entrega", "Pedidos", "Receita"),
		...rows.map(
			(row): Row => [
				row.unitName,
				row.radiusKm ?? "Sem raio",
				money(row.deliveryFee),
				row.orderCount,
				money(row.totalRevenue),
			],
		),
	];
}

function buildOrdersSheet(orders: ExportableOrder[]): SheetData {
	return [
		header(
			"Data",
			"Pedido",
			"Cliente",
			"Telefone",
			"Unidade",
			"Método",
			"Status",
			"Cupom",
			"Itens",
			"Subtotal",
			"Taxa de entrega",
			"Desconto",
			"Total",
		),
		...orders.map(
			(order): Row => [
				{ format: DATE_FORMAT, type: Date, value: order.createdAt },
				order.displayNumber,
				order.customer.user.name ?? "",
				order.customer.phone ?? "",
				order.unit.name,
				DELIVERY_METHOD_LABELS[order.deliveryMethod] ?? order.deliveryMethod,
				order.status,
				order.coupon?.code ?? "",
				order.items
					.map(item => {
						const options = item.optionSnapshots.map(option => option.optionName).join(", ");
						return `${item.quantity}x ${item.productName}${options ? ` (${options})` : ""}`;
					})
					.join(" | "),
				money(order.subtotal),
				money(order.deliveryFee),
				money(order.discountCents),
				money(Math.max(0, order.total - (order.feeTotalCents ?? 0))),
			],
		),
	];
}

/**
 * Lays out every sheet of the dashboard export. Kept separate from the use-case (and free of I/O) so
 * the contents can be asserted without writing and re-parsing a workbook.
 */
export function buildReportSheets(input: ReportSheetsInput): Sheet<Buffer>[] {
	const { analytics, bestSellers, business, financial, now, orders, since, summary, until } = input;
	// The period sheets mirror the dashboard chart, which only counts completed orders — unlike the
	// "Pedidos" sheet, which lists every status.
	const completedOrders = orders.filter(order => COMPLETED.includes(order.status));

	return [
		...(financial ? [{ data: buildFinancialSheet(financial, business), sheet: "Financeiro" }] : []),
		{ data: buildSummarySheet({ since, summary, until }), sheet: "Resumo" },
		{ data: buildBestSellersSheet(bestSellers), sheet: "Mais vendidos" },
		...GROUP_BY_SHEETS.map(({ groupBy, sheet }) => ({
			data: buildOrdersByPeriodSheet(completedOrders, groupBy, since, now),
			sheet,
		})),
		{ data: buildDeliveryRadiusSheet(analytics.deliveryRadiusPerformance), sheet: "Raio de entrega" },
		{ data: buildOrdersSheet(orders), sheet: "Pedidos" },
	];
}
