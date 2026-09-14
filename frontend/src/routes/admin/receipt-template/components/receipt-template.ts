import type { GetOrdersByOrderIdReceipt200 } from "@/lib/api";
import type { TFunction } from "i18next";
import type { ReceiptBlockMeta, ReceiptBlockType, ReceiptTemplate } from "./types";

export const DEFAULT_RECEIPT_TEMPLATE: ReceiptTemplate = {
	blocks: [
		{ id: "unit-name", type: "unitName" },
		{ id: "order-number", type: "orderNumber" },
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

export const DYNAMIC_BLOCK_TYPES: ReceiptBlockType[] = [
	"unitName",
	"orderNumber",
	"status",
	"date",
	"deliveryMethod",
	"customerName",
	"customerPhone",
	"address",
	"items",
	"payment",
	"subtotal",
	"deliveryFee",
	"discount",
	"cashback",
	"loyalty",
	"total",
	"preparedBy",
];

export function createBlockMeta(t: TFunction): Record<ReceiptBlockType, ReceiptBlockMeta> {
	return {
		address: {
			description: t("admin.receiptTemplate.blocks.address.description"),
			label: t("admin.receiptTemplate.blocks.address.label"),
		},
		cashback: {
			description: t("admin.receiptTemplate.blocks.cashback.description"),
			label: t("admin.receiptTemplate.blocks.cashback.label"),
		},
		customerName: {
			description: t("admin.receiptTemplate.blocks.customerName.description"),
			label: t("admin.receiptTemplate.blocks.customerName.label"),
		},
		customerPhone: {
			description: t("admin.receiptTemplate.blocks.customerPhone.description"),
			label: t("admin.receiptTemplate.blocks.customerPhone.label"),
		},
		date: {
			description: t("admin.receiptTemplate.blocks.date.description"),
			label: t("admin.receiptTemplate.blocks.date.label"),
		},
		deliveryFee: {
			description: t("admin.receiptTemplate.blocks.deliveryFee.description"),
			label: t("admin.receiptTemplate.blocks.deliveryFee.label"),
		},
		deliveryMethod: {
			description: t("admin.receiptTemplate.blocks.deliveryMethod.description"),
			label: t("admin.receiptTemplate.blocks.deliveryMethod.label"),
		},
		discount: {
			description: t("admin.receiptTemplate.blocks.discount.description"),
			label: t("admin.receiptTemplate.blocks.discount.label"),
		},
		items: {
			description: t("admin.receiptTemplate.blocks.items.description"),
			label: t("admin.receiptTemplate.blocks.items.label"),
		},
		loyalty: {
			description: t("admin.receiptTemplate.blocks.loyalty.description"),
			label: t("admin.receiptTemplate.blocks.loyalty.label"),
		},
		orderNumber: {
			description: t("admin.receiptTemplate.blocks.orderNumber.description"),
			label: t("admin.receiptTemplate.blocks.orderNumber.label"),
		},
		payment: {
			description: t("admin.receiptTemplate.blocks.payment.description"),
			label: t("admin.receiptTemplate.blocks.payment.label"),
		},
		preparedBy: {
			description: t("admin.receiptTemplate.blocks.preparedBy.description"),
			label: t("admin.receiptTemplate.blocks.preparedBy.label"),
		},
		status: {
			description: t("admin.receiptTemplate.blocks.status.description"),
			label: t("admin.receiptTemplate.blocks.status.label"),
		},
		subtotal: {
			description: t("admin.receiptTemplate.blocks.subtotal.description"),
			label: t("admin.receiptTemplate.blocks.subtotal.label"),
		},
		separator: {
			description: t("admin.receiptTemplate.blocks.separator.description"),
			label: t("admin.receiptTemplate.blocks.separator.label"),
		},
		text: {
			description: t("admin.receiptTemplate.blocks.text.description"),
			label: t("admin.receiptTemplate.blocks.text.label"),
		},
		total: {
			description: t("admin.receiptTemplate.blocks.total.description"),
			label: t("admin.receiptTemplate.blocks.total.label"),
		},
		unitName: {
			description: t("admin.receiptTemplate.blocks.unitName.description"),
			label: t("admin.receiptTemplate.blocks.unitName.label"),
		},
	};
}

export const SAMPLE_RECEIPT: GetOrdersByOrderIdReceipt200 = {
	address: null,
	cashbackCentsRedeemed: 0,
	createdAt: new Date("2026-09-14T14:39:00.000Z"),
	customer: { name: "Vender Teste", phone: "(81) 99999-9999" },
	deliveryFee: 0,
	deliveryMethod: "pickup",
	discountCents: 0,
	displayNumber: 18,
	id: "preview",
	items: [
		{
			id: "preview-item",
			note: null,
			options: [{ groupName: "Sabor", optionName: "Chocolate", priceDeltaCents: 0, quantity: 1 }],
			productName: "Petit Gâteau",
			quantity: 1,
			total: 2490,
			unitPrice: 2490,
		},
	],
	loyaltyPointsRedeemed: 0,
	payment: { method: "pix", status: "confirmed" },
	preparedBy: { id: "preview-staff", name: "João" },
	status: "entregue",
	subtotal: 2490,
	template: DEFAULT_RECEIPT_TEMPLATE,
	total: 2490,
	unit: { id: "preview-unit", name: "Tucumã" },
};
