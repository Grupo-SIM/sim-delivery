import { beforeAll, describe, expect, it } from "bun:test";
import type { GetOrdersByOrderIdReceipt200 } from "@/lib/api";
import type { OrderReceiptLabels } from "./-order-receipt-pdf";

let createOrderReceiptPdf: typeof import("./-order-receipt-pdf").createOrderReceiptPdf;
let receiptWidthMm: number;

beforeAll(async () => {
	const atob = (value: string) => Buffer.from(value, "base64").toString("binary");
	const btoa = (value: string) => Buffer.from(value, "binary").toString("base64");
	globalThis.atob ??= atob;
	globalThis.btoa ??= btoa;
	const browserGlobal = (globalThis as typeof globalThis & { window?: Window }).window;
	if (browserGlobal) {
		browserGlobal.atob ??= atob;
		browserGlobal.btoa ??= btoa;
	}
	const receiptModule = await import("./-order-receipt-pdf");
	createOrderReceiptPdf = receiptModule.createOrderReceiptPdf;
	receiptWidthMm = receiptModule.RECEIPT_WIDTH_MM;
});

const labels: OrderReceiptLabels = {
	address: "Endereço",
	addressMissing: "ENDEREÇO NÃO INFORMADO",
	cashback: "Cashback",
	customer: "Cliente",
	date: "Data",
	delivery: "ENTREGA",
	deliveryFee: "Entrega",
	discount: "Descontos",
	loyalty: "Fidelidade",
	note: "OBSERVAÇÃO",
	order: "PEDIDO",
	payment: "Pagamento",
	paymentMethod: "PIX",
	paymentMissing: "Pagamento não informado",
	paymentStatus: "Confirmado",
	pickup: "RETIRADA",
	preparedBy: "Responsável pelo preparo",
	status: "Em preparo",
	statusLabel: "Status",
	subtotal: "Subtotal",
	total: "TOTAL",
};

const defaultTemplate: GetOrdersByOrderIdReceipt200["template"] = {
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

const receipt: GetOrdersByOrderIdReceipt200 = {
	address: {
		addressLine: "Rua das Flores",
		city: "Fortaleza",
		complement: "Apto 201",
		neighborhood: "Centro",
		number: "123",
		reference: "Próximo à praça",
		state: "CE",
		zipCode: "60000-000",
	},
	cashbackCentsRedeemed: 100,
	createdAt: new Date("2026-08-31T15:30:00.000Z"),
	customer: { name: "Ana", phone: "85999999999" },
	deliveryFee: 500,
	deliveryMethod: "delivery",
	discountCents: 200,
	displayNumber: 42,
	id: "ord_1",
	items: [
		{
			id: "item_1",
			note: "Sem cebola",
			options: [
				{
					groupName: "Adicionais",
					optionName: "Bacon",
					priceDeltaCents: 300,
					quantity: 2,
				},
			],
			productName: "Hambúrguer",
			quantity: 2,
			total: 3600,
			unitPrice: 1800,
		},
	],
	loyaltyPointsRedeemed: 50,
	payment: { method: "pix", status: "confirmed" },
	preparedBy: { id: "staff_1", name: "Carlos" },
	status: "em_preparo",
	subtotal: 3600,
	template: defaultTemplate,
	total: 3750,
	unit: { id: "unit_1", name: "Unidade Centro" },
};

function signature(document: ReturnType<typeof createOrderReceiptPdf>) {
	return new TextDecoder().decode(new Uint8Array(document.output("arraybuffer")).slice(0, 4));
}

describe("createOrderReceiptPdf", () => {
	it("creates a real one-page 72 mm PDF with delivery, PIX, options and discounts", () => {
		const document = createOrderReceiptPdf(receipt, labels);
		expect(signature(document)).toBe("%PDF");
		expect(document.getNumberOfPages()).toBe(1);
		expect(receiptWidthMm).toBe(72);
		expect(document.internal.pageSize.getWidth()).toBeCloseTo(receiptWidthMm, 2);
		expect(document.output()).toContain("Bacon");
		expect(document.output()).toContain("/PickTrayByPDFSize true");
		expect(document.output()).toContain("/PrintScaling /None");
		expect(document.output()).toContain("Sem cebola");
	});

	it("supports pickup without address and card payment", () => {
		const document = createOrderReceiptPdf(
			{
				...receipt,
				address: null,
				deliveryFee: 0,
				deliveryMethod: "pickup",
				payment: { method: "credit_card", status: "pending" },
			},
			{ ...labels, paymentMethod: "Cartão de crédito", paymentStatus: "Pendente" },
		);
		expect(signature(document)).toBe("%PDF");
		expect(document.output()).toContain("RETIRADA");
	});

	it("prints explicit fallbacks for delivery without address or payment", () => {
		const document = createOrderReceiptPdf({ ...receipt, address: null, payment: null }, labels);
		expect(document.output()).toContain("ENDEREÇO NÃO INFORMADO");
		expect(document.output()).toContain("Pagamento não informado");
	});

	it("honors custom order, removed sections, separators and styled free text", () => {
		const document = createOrderReceiptPdf(
			{
				...receipt,
				template: {
					blocks: [
						{ align: "center", bold: true, content: "VOLTE SEMPRE", id: "text-1", size: "large", type: "text" },
						{ id: "separator-1", type: "separator" },
						{ id: "items", type: "items" },
					],
				},
			},
			labels,
		);

		expect(document.output()).toContain("VOLTE SEMPRE");
		expect(document.output()).toContain("Bacon");
		expect(document.output()).not.toContain("Unidade Centro");
		expect(document.output()).not.toContain("Subtotal");
	});

	it("grows page height and preserves the final marker for long content", () => {
		const shortDocument = createOrderReceiptPdf(receipt, labels);
		const longDescription =
			"Produto artesanal com uma descrição extensa que precisa quebrar em várias linhas sem ultrapassar a largura imprimível FINALMARKER";
		const longDocument = createOrderReceiptPdf(
			{
				...receipt,
				items: Array.from({ length: 30 }, (_, index) => ({
					...receipt.items[0],
					id: `item_${index}`,
					note: `${longDescription} observação ${index}`,
					productName: `${longDescription} produto ${index}`,
				})),
			},
			labels,
		);

		expect(longDocument.internal.pageSize.getHeight()).toBeGreaterThan(
			shortDocument.internal.pageSize.getHeight(),
		);
		expect(longDocument.getNumberOfPages()).toBe(1);
		expect(longDocument.output()).toContain("FINALMARKER");
	});
});
