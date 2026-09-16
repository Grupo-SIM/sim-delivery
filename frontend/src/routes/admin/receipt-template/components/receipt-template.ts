import type { GetOrdersByOrderIdReceipt200 } from "@/lib/api";
import type { TFunction } from "i18next";
import type { ReceiptBlockMeta, ReceiptBlockType, ReceiptTemplate } from "./types";

export const DEFAULT_RECEIPT_TEMPLATE: ReceiptTemplate = {
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
		{ id: "fees", type: "fees" },
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
	"estimatedDelivery",
	"firstOrder",
	"deliveryMethod",
	"customerName",
	"customerPhone",
	"customerCpf",
	"address",
	"items",
	"payment",
	"paymentAmount",
	"amountDue",
	"subtotal",
	"deliveryFee",
	"discount",
	"cashback",
	"loyalty",
	"fees",
	"total",
	"preparedBy",
];

export function createBlockMeta(t: TFunction): Record<ReceiptBlockType, ReceiptBlockMeta> {
	return {
		address: {
			description: t("admin.receiptTemplate.blocks.address.description"),
			label: t("admin.receiptTemplate.blocks.address.label"),
		},
		amountDue: {
			description: t("admin.receiptTemplate.blocks.amountDue.description"),
			label: t("admin.receiptTemplate.blocks.amountDue.label"),
		},
		cashback: {
			description: t("admin.receiptTemplate.blocks.cashback.description"),
			label: t("admin.receiptTemplate.blocks.cashback.label"),
		},
		customerName: {
			description: t("admin.receiptTemplate.blocks.customerName.description"),
			label: t("admin.receiptTemplate.blocks.customerName.label"),
		},
		customerCpf: {
			description: t("admin.receiptTemplate.blocks.customerCpf.description"),
			label: t("admin.receiptTemplate.blocks.customerCpf.label"),
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
		estimatedDelivery: {
			description: t("admin.receiptTemplate.blocks.estimatedDelivery.description"),
			label: t("admin.receiptTemplate.blocks.estimatedDelivery.label"),
		},
		firstOrder: {
			description: t("admin.receiptTemplate.blocks.firstOrder.description"),
			label: t("admin.receiptTemplate.blocks.firstOrder.label"),
		},
		fees: {
			description: t("admin.receiptTemplate.blocks.fees.description"),
			label: t("admin.receiptTemplate.blocks.fees.label"),
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
		paymentAmount: {
			description: t("admin.receiptTemplate.blocks.paymentAmount.description"),
			label: t("admin.receiptTemplate.blocks.paymentAmount.label"),
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
	address: {
		addressLine: "Rua das Rosas",
		city: "Rio Branco",
		complement: "Apto 2",
		neighborhood: "Jardim Primavera",
		number: "292",
		reference: null,
		state: "AC",
		zipCode: "69919-602",
	},
	cashbackCentsRedeemed: 0,
	createdAt: new Date("2026-09-14T14:39:00.000Z"),
	customer: { cpf: "05041757267", name: "Neto Araujo", phone: "0800 705 1020" },
	deliveryFee: 0,
	deliveryMethod: "delivery",
	discountCents: 0,
	feeTotalCents: 50,
	fees: [{ amountCents: 50, displayMode: "checkout_only", id: "preview-fee", name: "Taxa de serviço" }],
	displayNumber: 18,
	estimatedDeliveryAt: new Date("2026-09-14T15:23:00.000Z"),
	id: "preview",
	isFirstOrder: true,
	items: [
		{
			id: "preview-item",
			note: null,
			options: [{ groupName: "Sabor", optionName: "Chocolate", priceDeltaCents: 0, quantity: 1 }],
			productName: "Petit Gâteau",
			quantity: 1,
			total: 2490,
			unitPrice: 2490,
			displayTotal: 2490,
			displayUnitPrice: 2490,
		},
	],
	loyaltyPointsRedeemed: 0,
	payment: { amount: 2540, method: "pix", refundedAmount: 0, status: "confirmed" },
	preparedBy: { id: "preview-staff", name: "João" },
	status: "entregue",
	subtotal: 2490,
	template: DEFAULT_RECEIPT_TEMPLATE,
	total: 2540,
	unit: { id: "preview-unit", name: "Tucumã" },
};
