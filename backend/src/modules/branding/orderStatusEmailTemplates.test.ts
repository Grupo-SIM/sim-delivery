import { describe, expect, it } from "bun:test";
import { getOrderStatusEmailTemplate, normalizeOrderStatusEmailTemplates } from "./orderStatusEmailTemplates";

describe("order status email templates", () => {
	it("keeps message templates by status", () => {
		const template = { message: "Seu pedido está pronto" };
		expect(normalizeOrderStatusEmailTemplates({ pronto: template })).toEqual({ pronto: template });
		expect(getOrderStatusEmailTemplate({ pronto: template }, "pronto")).toEqual(template);
	});

	it("returns an empty template for an unknown status", () => {
		expect(getOrderStatusEmailTemplate(null, "pronto")).toEqual({});
	});
});
