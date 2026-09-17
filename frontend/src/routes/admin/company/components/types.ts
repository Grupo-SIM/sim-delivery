export const ORDER_STATUS_TEMPLATE_KEYS = [
	"recebido",
	"em_preparo",
	"pronto",
	"saiu_para_entrega",
	"entregue",
	"retirado",
	"cancelado",
] as const;
export type OrderStatusTemplateKey = (typeof ORDER_STATUS_TEMPLATE_KEYS)[number];
export interface WhatsAppTemplateAttachment {
	filename: string;
	mimeType: "application/pdf" | "image/jpeg" | "image/png" | "image/webp";
	url: string;
}
export interface OrderStatusTemplate {
	attachments: WhatsAppTemplateAttachment[];
	message: string;
}
export type OrderStatusTemplates = Record<OrderStatusTemplateKey, OrderStatusTemplate>;

export interface OrderStatusEmailTemplate {
	message: string;
	subtitle: string;
	title: string;
}

export type OrderStatusEmailTemplates = Record<OrderStatusTemplateKey, OrderStatusEmailTemplate>;

export const emptyOrderStatusEmailTemplates: OrderStatusEmailTemplates = {
	cancelado: { message: "", subtitle: "", title: "" },
	em_preparo: { message: "", subtitle: "", title: "" },
	entregue: { message: "", subtitle: "", title: "" },
	pronto: { message: "", subtitle: "", title: "" },
	recebido: { message: "", subtitle: "", title: "" },
	retirado: { message: "", subtitle: "", title: "" },
	saiu_para_entrega: { message: "", subtitle: "", title: "" },
};

export const defaultOrderStatusTemplates: OrderStatusTemplates = {
	cancelado: { attachments: [], message: "Seu pedido {{orderId}} foi cancelado.\nMotivo: {{reason}}" },
	em_preparo: { attachments: [], message: "Seu pedido {{orderId}} já está sendo preparado com carinho." },
	entregue: { attachments: [], message: "Seu pedido {{orderId}} chegou até você. Bom apetite!" },
	pronto: { attachments: [], message: "Seu pedido {{orderId}} está pronto." },
	recebido: {
		attachments: [],
		message: "Recebemos seu pedido {{orderId}} e ele já entrou na fila de preparo.",
	},
	retirado: { attachments: [], message: "Seu pedido {{orderId}} foi retirado. Bom apetite!" },
	saiu_para_entrega: {
		attachments: [],
		message: "Seu pedido {{orderId}} saiu para entrega e está a caminho.",
	},
};

export const defaultOrderStatusEmailTemplates: OrderStatusEmailTemplates = Object.fromEntries(
	ORDER_STATUS_TEMPLATE_KEYS.map(status => [
		status,
		{ message: defaultOrderStatusTemplates[status].message, subtitle: "Acompanhe seu pedido", title: "Atualização do pedido {{orderId}}" },
	]),
) as OrderStatusEmailTemplates;

export interface BrandAssetsState {
	homepageBannerUrls: string[];
	logoUrl: string;
	mobileIconUrl: string;
	unitFallbackImageUrl: string;
}

export const emptyBrandAssets: BrandAssetsState = {
	homepageBannerUrls: [""],
	logoUrl: "",
	mobileIconUrl: "",
	unitFallbackImageUrl: "",
};

export interface FontsState {
	display: string;
	displayUrl: string;
	family: string;
	familyUrl: string;
}

export const emptyFonts: FontsState = { display: "", displayUrl: "", family: "", familyUrl: "" };

export interface FooterState {
	facebookUrl: string;
	instagramUrl: string;
	paymentMethods: string;
	supportEmail: string;
	text: string;
	whatsApp: string;
}

export const emptyFooter: FooterState = {
	facebookUrl: "",
	instagramUrl: "",
	paymentMethods: "",
	supportEmail: "",
	text: "",
	whatsApp: "",
};

export interface TrackingState {
	ga4Id: string;
	gtmId: string;
	metaPixelId: string;
}

export const emptyTracking: TrackingState = { ga4Id: "", gtmId: "", metaPixelId: "" };
