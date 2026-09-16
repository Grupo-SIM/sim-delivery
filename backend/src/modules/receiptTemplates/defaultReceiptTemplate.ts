import type { ReceiptTemplate } from "./dtos";

export const defaultReceiptTemplate: ReceiptTemplate = {
	blocks: [
		{ id: "unit-name", type: "unitName" },
		{ id: "order-number", orderNumberStyle: "normal", type: "orderNumber" },
		{ id: "status", type: "status" },
		{ id: "date", type: "date" },
		{ id: "separator-1", type: "separator" },
		{ id: "delivery-method", type: "deliveryMethod" },
		{ id: "customer-name", type: "customerName" },
		{ id: "customer-phone", type: "customerPhone" },
		{ id: "address", type: "address" },
		{ id: "separator-2", type: "separator" },
		{ id: "items", type: "items" },
		{ id: "separator-3", type: "separator" },
		{ id: "payment", type: "payment" },
		{ id: "separator-4", type: "separator" },
		{ id: "subtotal", type: "subtotal" },
		{ id: "delivery-fee", type: "deliveryFee" },
		{ id: "discount", type: "discount" },
		{ id: "cashback", type: "cashback" },
		{ id: "loyalty", type: "loyalty" },
		{ id: "total", type: "total" },
		{ id: "separator-5", type: "separator" },
		{ id: "prepared-by", type: "preparedBy" },
	],
};
