const DEFAULT_ORDER_STATUS_MESSAGES: Record<string, string> = {
	em_preparo: "Seu pedido {{orderNumber}} está em preparo.",
	entregue: "Seu pedido {{orderNumber}} foi entregue. Bom apetite!",
	pronto: "Seu pedido {{orderNumber}} está pronto e logo seguirá para você.",
	recebido: "Recebemos seu pedido {{orderNumber}}. Em breve começaremos o preparo.",
	retirado: "Seu pedido {{orderNumber}} foi retirado. Bom apetite!",
	saiu_para_entrega: "Seu pedido {{orderNumber}} saiu para entrega.",
};

export function formatOrderStatusMessage(template: string | undefined, status: string, orderNumber: number): string {
	const orderReference = `#${orderNumber}`;
	return (
		template ??
		DEFAULT_ORDER_STATUS_MESSAGES[status] ??
		`Atualização do pedido ${orderReference}: ${status}.`
	)
		.replaceAll("{{orderId}}", orderReference)
		.replaceAll("{{orderNumber}}", orderReference);
}
