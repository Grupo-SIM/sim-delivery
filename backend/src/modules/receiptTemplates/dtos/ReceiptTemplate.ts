import { t } from "elysia";

export const ReceiptBlockType = t.Union([
	t.Literal("unitName"),
	t.Literal("orderNumber"),
	t.Literal("status"),
	t.Literal("date"),
	t.Literal("estimatedDelivery"),
	t.Literal("firstOrder"),
	t.Literal("deliveryMethod"),
	t.Literal("customerName"),
	t.Literal("customerPhone"),
	t.Literal("customerCpf"),
	t.Literal("address"),
	t.Literal("items"),
	t.Literal("payment"),
	t.Literal("paymentAmount"),
	t.Literal("amountDue"),
	t.Literal("subtotal"),
	t.Literal("deliveryFee"),
	t.Literal("discount"),
	t.Literal("cashback"),
	t.Literal("loyalty"),
	t.Literal("total"),
	t.Literal("preparedBy"),
	t.Literal("separator"),
	t.Literal("text"),
]);
export type ReceiptBlockType = typeof ReceiptBlockType.static;

export const ReceiptTextAlign = t.Union([t.Literal("left"), t.Literal("center"), t.Literal("right")]);
export const ReceiptTextSize = t.Union([t.Literal("small"), t.Literal("normal"), t.Literal("large")]);
export const ReceiptOrderNumberStyle = t.Union([t.Literal("normal"), t.Literal("giant")]);
export const ReceiptSeparatorStyle = t.Union([t.Literal("solid"), t.Literal("dashed")]);

export const ReceiptBlock = t.Object({
	align: t.Optional(ReceiptTextAlign),
	bold: t.Optional(t.Boolean()),
	content: t.Optional(t.String({ maxLength: 500 })),
	id: t.String({ maxLength: 80, minLength: 1 }),
	orderNumberStyle: t.Optional(ReceiptOrderNumberStyle),
	separatorStyle: t.Optional(ReceiptSeparatorStyle),
	size: t.Optional(ReceiptTextSize),
	type: ReceiptBlockType,
});
export type ReceiptBlock = typeof ReceiptBlock.static;

export const ReceiptTemplate = t.Object({
	blocks: t.Array(ReceiptBlock, { maxItems: 50, minItems: 1 }),
});
export type ReceiptTemplate = typeof ReceiptTemplate.static;

export const UpdateReceiptTemplateBody = ReceiptTemplate;
export type UpdateReceiptTemplateBody = typeof UpdateReceiptTemplateBody.static;

export const UpdateReceiptTemplateDTO = t.Object({
	...UpdateReceiptTemplateBody.properties,
	companyId: t.String(),
});
export type UpdateReceiptTemplateDTO = typeof UpdateReceiptTemplateDTO.static;
