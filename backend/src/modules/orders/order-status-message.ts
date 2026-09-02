const DEFAULT_ORDER_STATUS_MESSAGES: Record<string, Record<string, string>> = {
	delivery: {
		em_preparo: "Seu pedido {{orderNumber}} já está sendo preparado com carinho. Assim que ficar pronto, seguirá para entrega.",
		entregue: "Seu pedido {{orderNumber}} chegou até você. Esperamos que aproveite cada detalhe!",
		pronto: "Seu pedido {{orderNumber}} está pronto e logo seguirá para entrega.",
		recebido: "Recebemos seu pedido {{orderNumber}} e ele já entrou na fila de preparo.",
		saiu_para_entrega: "Seu pedido {{orderNumber}} saiu para entrega e está a caminho.",
	},
	pickup: {
		em_preparo: "Seu pedido {{orderNumber}} já está sendo preparado com carinho. Avisaremos assim que estiver pronto para retirada.",
		pronto: "Seu pedido {{orderNumber}} está pronto para retirada. Esperamos você!",
		recebido: "Recebemos seu pedido {{orderNumber}} e ele já entrou na fila de preparo.",
		retirado: "Seu pedido {{orderNumber}} foi retirado. Esperamos que aproveite cada detalhe!",
	},
};

export function formatOrderStatusMessage(
	template: string | undefined,
	status: string,
	orderNumber: number,
	deliveryMethod = "delivery",
): string {
	const orderReference = `#${orderNumber}`;
	return (
		template ??
		DEFAULT_ORDER_STATUS_MESSAGES[deliveryMethod]?.[status] ??
		`Atualização do pedido ${orderReference}: ${status}.`
	)
		.replaceAll("{{orderId}}", orderReference)
		.replaceAll("{{orderNumber}}", orderReference);
}
