export const ORDER_STATUS_TEMPLATE_KEYS = [
	"em_preparo",
	"saiu_para_entrega",
	"entregue",
	"retirado",
] as const;
export type OrderStatusTemplateKey = (typeof ORDER_STATUS_TEMPLATE_KEYS)[number];
export type OrderStatusTemplates = Record<OrderStatusTemplateKey, string>;

export const defaultOrderStatusTemplates: OrderStatusTemplates = {
	em_preparo: "Seu pedido {{orderId}} já está sendo preparado com carinho.",
	entregue: "Seu pedido {{orderId}} chegou até você. Bom apetite!",
	retirado: "Seu pedido {{orderId}} foi retirado. Bom apetite!",
	saiu_para_entrega: "Seu pedido {{orderId}} saiu para entrega e está a caminho.",
};

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
