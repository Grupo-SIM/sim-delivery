const DEFAULT_ORDER_STATUS_MESSAGES: Record<string, string> = {
	em_preparo: "Seu pedido {{orderId}} está em preparo.",
	entregue: "Seu pedido {{orderId}} foi entregue. Bom apetite!",
	pronto: "Seu pedido {{orderId}} está pronto e logo seguirá para você.",
	recebido: "Recebemos seu pedido {{orderId}}. Em breve começaremos o preparo.",
	retirado: "Seu pedido {{orderId}} foi retirado. Bom apetite!",
	saiu_para_entrega: "Seu pedido {{orderId}} saiu para entrega.",
};

export function formatOrderStatusMessage(template: string | undefined, status: string, orderId: string): string {
	return (
		template ??
		DEFAULT_ORDER_STATUS_MESSAGES[status] ??
		`Atualização do pedido ${orderId}: ${status}.`
	).replaceAll("{{orderId}}", orderId);
}
