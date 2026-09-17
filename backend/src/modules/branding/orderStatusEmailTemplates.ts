import type { OrderStatusEmailTemplate, OrderStatusEmailTemplates } from "./dtos";

export function normalizeOrderStatusEmailTemplates(value: unknown): OrderStatusEmailTemplates | null {
	if (!value || typeof value !== "object" || Array.isArray(value)) return null;

	return Object.fromEntries(
		Object.entries(value).flatMap(([status, template]) => {
			if (!template || typeof template !== "object" || Array.isArray(template)) return [];
			return [[status, template as OrderStatusEmailTemplate]];
		}),
	) as OrderStatusEmailTemplates;
}

export function getOrderStatusEmailTemplate(
	templates: Record<string, OrderStatusEmailTemplate> | null | undefined,
	status: string,
): OrderStatusEmailTemplate {
	return templates?.[status] ?? {};
}
