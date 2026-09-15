import type { OrderStatusWhatsAppTemplate, OrderStatusWhatsAppTemplates } from "./dtos";

type StoredTemplate = string | OrderStatusWhatsAppTemplate;

export function normalizeOrderStatusWhatsAppTemplates(value: unknown): OrderStatusWhatsAppTemplates | null {
	if (!value || typeof value !== "object" || Array.isArray(value)) return null;

	return Object.fromEntries(
		Object.entries(value).flatMap(([status, template]) => {
			if (typeof template === "string") return [[status, { message: template }]];
			if (!template || typeof template !== "object" || Array.isArray(template)) return [];
			return [[status, template as OrderStatusWhatsAppTemplate]];
		}),
	) as OrderStatusWhatsAppTemplates;
}

export function getOrderStatusWhatsAppTemplate(
	templates: Record<string, StoredTemplate> | null | undefined,
	status: string,
): OrderStatusWhatsAppTemplate {
	const template = templates?.[status];
	if (typeof template === "string") return { message: template };
	return template ?? {};
}
