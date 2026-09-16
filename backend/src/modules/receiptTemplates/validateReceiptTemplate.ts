import type { ReceiptTemplate } from "./dtos";

const singletonTypes = new Set([
	"unitName", "orderNumber", "status", "date", "estimatedDelivery", "firstOrder", "deliveryMethod",
	"customerName", "customerPhone", "customerCpf", "address", "items", "payment", "paymentAmount",
	"amountDue", "subtotal", "deliveryFee", "discount", "cashback", "loyalty", "total",
	"preparedBy",
]);
const allowedTypes = new Set([...singletonTypes, "separator", "text"]);
const allowedAlignments = new Set(["left", "center", "right"]);
const allowedSizes = new Set(["small", "normal", "large"]);
const allowedOrderNumberStyles = new Set(["normal", "giant"]);
const allowedSeparatorStyles = new Set(["solid", "dashed"]);

export function isValidReceiptTemplate(value: unknown): value is ReceiptTemplate {
	if (!value || typeof value !== "object" || !("blocks" in value) || !Array.isArray(value.blocks)) return false;
	if (value.blocks.length < 1 || value.blocks.length > 50) return false;
	const ids = new Set<string>();
	const singletonBlocks = new Set<string>();
	for (const block of value.blocks) {
		if (!block || typeof block !== "object" || typeof block.id !== "string" || typeof block.type !== "string") return false;
		if (!block.id || block.id.length > 80 || !allowedTypes.has(block.type)) return false;
		if ("align" in block && block.align !== undefined && !allowedAlignments.has(String(block.align))) return false;
		if ("size" in block && block.size !== undefined && !allowedSizes.has(String(block.size))) return false;
		if ("bold" in block && block.bold !== undefined && typeof block.bold !== "boolean") return false;
		if ("content" in block && block.content !== undefined && (typeof block.content !== "string" || block.content.length > 500)) return false;
		if ("orderNumberStyle" in block && block.orderNumberStyle !== undefined && !allowedOrderNumberStyles.has(String(block.orderNumberStyle))) return false;
		if ("separatorStyle" in block && block.separatorStyle !== undefined && !allowedSeparatorStyles.has(String(block.separatorStyle))) return false;
		if (ids.has(block.id)) return false;
		ids.add(block.id);
		if (singletonTypes.has(block.type)) {
			if (singletonBlocks.has(block.type)) return false;
			singletonBlocks.add(block.type);
		}
		if (block.type === "text" && (typeof block.content !== "string" || !block.content.trim())) return false;
	}
	return true;
}
