export const ORDER_STATUS_TEMPLATE_KEYS = [
	"em_preparo",
	"saiu_para_entrega",
	"entregue",
	"retirado",
] as const;
export type OrderStatusTemplateKey = (typeof ORDER_STATUS_TEMPLATE_KEYS)[number];
export type OrderStatusTemplates = Record<OrderStatusTemplateKey, string>;

export const defaultOrderStatusTemplates: OrderStatusTemplates = {
	em_preparo: "Seu pedido {{orderId}} está em preparo.",
	entregue: "Seu pedido {{orderId}} foi entregue. Bom apetite!",
	retirado: "Seu pedido {{orderId}} está pronto para retirada.",
	saiu_para_entrega: "Seu pedido {{orderId}} saiu para entrega.",
};

export interface BrandAssetsState {
	logoUrl: string;
	mobileIconUrl: string;
	unitFallbackImageUrl: string;
}

export const emptyBrandAssets: BrandAssetsState = {
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
