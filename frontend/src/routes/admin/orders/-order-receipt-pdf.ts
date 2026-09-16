import { jsPDF } from "jspdf";
import type { GetOrdersByOrderIdReceipt200 } from "@/lib/api";

export const RECEIPT_WIDTH_MM = 72;
export const RECEIPT_MARGIN_MM = 4;
const MIN_RECEIPT_HEIGHT_MM = 90;
const CONTENT_WIDTH_MM = RECEIPT_WIDTH_MM - RECEIPT_MARGIN_MM * 2;

export interface OrderReceiptLabels {
	address: string;
	addressMissing: string;
	amountDue: string;
	cashback: string;
	customerCpf: string;
	customer: string;
	date: string;
	delivery: string;
	deliveryFee: string;
	discount: string;
	estimatedDelivery: string;
	firstOrder: string;
	fees: string;
	loyalty: string;
	note: string;
	order: string;
	payment: string;
	paymentAmount: string;
	paymentMethod: string;
	paymentMissing: string;
	paymentStatus: string;
	pickup: string;
	preparedBy: string;
	status: string;
	statusLabel: string;
	subtotal: string;
	total: string;
}

interface ReceiptCursor {
	doc: jsPDF;
	y: number;
}

function formatMoney(value: string | number): string {
	return (Number(value) / 100).toLocaleString("pt-BR", { currency: "BRL", style: "currency" });
}

function setTextStyle(doc: jsPDF, size: number, style: "bold" | "normal" = "normal") {
	doc.setFont("helvetica", style);
	doc.setFontSize(size);
	doc.setTextColor(0, 0, 0);
}

function drawWrappedText(
	cursor: ReceiptCursor,
	text: string,
	options: {
		align?: "center" | "left" | "right";
		fontSize?: number;
		indent?: number;
		style?: "bold" | "normal";
		width?: number;
	} = {},
) {
	const { align = "left", fontSize = 8, indent = 0, style = "normal" } = options;
	const width = options.width ?? CONTENT_WIDTH_MM - indent;
	setTextStyle(cursor.doc, fontSize, style);
	const lines = cursor.doc.splitTextToSize(text, width) as string[];
	const lineHeight = fontSize * 0.42;
	for (const line of lines) {
		cursor.doc.text(
			line,
			align === "center"
				? RECEIPT_WIDTH_MM / 2
				: align === "right"
					? RECEIPT_WIDTH_MM - RECEIPT_MARGIN_MM - indent
					: RECEIPT_MARGIN_MM + indent,
			cursor.y,
			{ align },
		);
		cursor.y += lineHeight;
	}
}

function drawSeparator(cursor: ReceiptCursor, dashed = false) {
	cursor.y += 2;
	cursor.doc.setDrawColor(0, 0, 0);
	cursor.doc.setLineWidth(0.2);
	cursor.doc.setLineDashPattern(dashed ? [1.2, 0.8] : [], 0);
	cursor.doc.line(RECEIPT_MARGIN_MM, cursor.y, RECEIPT_WIDTH_MM - RECEIPT_MARGIN_MM, cursor.y);
	cursor.doc.setLineDashPattern([], 0);
	cursor.y += 4;
}

function drawGiantOrderNumber(cursor: ReceiptCursor, value: string) {
	const boxHeight = 13;
	cursor.y -= 2;
	cursor.doc.setFillColor(0, 0, 0);
	cursor.doc.rect(RECEIPT_MARGIN_MM, cursor.y, CONTENT_WIDTH_MM, boxHeight, "F");
	setTextStyle(cursor.doc, value.length > 6 ? 20 : 28, "bold");
	cursor.doc.setTextColor(255, 255, 255);
	cursor.doc.text(value, RECEIPT_WIDTH_MM / 2, cursor.y + 9.5, { align: "center" });
	cursor.doc.setTextColor(0, 0, 0);
	cursor.y += boxHeight + 2;
}

function drawAmountRow(cursor: ReceiptCursor, label: string, value: string, bold = false) {
	const fontSize = bold ? 9 : 8;
	setTextStyle(cursor.doc, fontSize, bold ? "bold" : "normal");
	const amountWidth = cursor.doc.getTextWidth(value);
	const labelWidth = Math.max(20, CONTENT_WIDTH_MM - amountWidth - 2);
	const lines = cursor.doc.splitTextToSize(label, labelWidth) as string[];
	const lineHeight = fontSize * 0.42;
	lines.forEach((line, index) => {
		cursor.doc.text(line, RECEIPT_MARGIN_MM, cursor.y);
		if (index === 0) {
			cursor.doc.text(value, RECEIPT_WIDTH_MM - RECEIPT_MARGIN_MM, cursor.y, { align: "right" });
		}
		cursor.y += lineHeight;
	});
}

function formatAddress(address: NonNullable<GetOrdersByOrderIdReceipt200["address"]>): string {
	return [
		`${address.addressLine}, ${address.number}`,
		address.complement,
		address.neighborhood,
		[address.city, address.state].filter(Boolean).join(" - "),
		address.zipCode,
		address.reference ? `Ref.: ${address.reference}` : null,
	]
		.filter(Boolean)
		.join(" · ");
}

function formatCpf(value: string): string {
	const digits = value.replace(/\D/g, "");
	return digits.length === 11
		? digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4")
		: value;
}

function paidAmount(receipt: GetOrdersByOrderIdReceipt200): number {
	if (!receipt.payment || !["confirmed", "partially_refunded", "refunded"].includes(receipt.payment.status)) return 0;
	return Math.max(0, Number(receipt.payment.amount) - Number(receipt.payment.refundedAmount));
}

function drawReceipt(doc: jsPDF, receipt: GetOrdersByOrderIdReceipt200, labels: OrderReceiptLabels): number {
	const cursor = { doc, y: RECEIPT_MARGIN_MM + 2 };
	const date = new Intl.DateTimeFormat("pt-BR", {
		day: "2-digit",
		hour: "2-digit",
		minute: "2-digit",
		month: "2-digit",
		year: "numeric",
	}).format(new Date(receipt.createdAt));
	const estimatedDelivery = receipt.estimatedDeliveryAt
		? new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit" }).format(
				new Date(receipt.estimatedDeliveryAt),
			)
		: null;

	for (const block of receipt.template.blocks) {
		switch (block.type) {
			case "unitName":
				drawWrappedText(cursor, receipt.unit.name, { align: "center", fontSize: 10, style: "bold" });
				break;
			case "orderNumber":
				if (block.orderNumberStyle === "giant") {
					drawGiantOrderNumber(cursor, String(receipt.displayNumber));
				} else {
					drawWrappedText(cursor, `${labels.order} #${receipt.displayNumber}`, {
						align: "center",
						fontSize: 13,
						style: "bold",
					});
				}
				break;
			case "status":
				drawWrappedText(cursor, `${labels.statusLabel}: ${labels.status}`);
				break;
			case "date":
				drawWrappedText(cursor, `${labels.date}: ${date}`);
				break;
			case "estimatedDelivery":
				if (receipt.deliveryMethod === "delivery" && estimatedDelivery) {
					drawWrappedText(cursor, `${labels.estimatedDelivery}: ${estimatedDelivery}`);
				}
				break;
			case "firstOrder":
				if (receipt.isFirstOrder) drawWrappedText(cursor, labels.firstOrder, { style: "bold" });
				break;
			case "deliveryMethod":
				drawWrappedText(cursor, receipt.deliveryMethod === "delivery" ? labels.delivery : labels.pickup, {
					fontSize: 10,
					style: "bold",
				});
				break;
			case "customerName":
				if (receipt.customer.name.trim()) drawWrappedText(cursor, `${labels.customer}: ${receipt.customer.name}`);
				break;
			case "customerPhone":
				if (receipt.customer.phone?.trim()) drawWrappedText(cursor, receipt.customer.phone);
				break;
			case "customerCpf":
				if (receipt.customer.cpf?.trim()) {
					drawWrappedText(cursor, `${labels.customerCpf}: ${formatCpf(receipt.customer.cpf)}`, { align: "center" });
				}
				break;
			case "address":
				if (receipt.deliveryMethod === "delivery") {
					drawWrappedText(
						cursor,
						receipt.address ? `${labels.address}: ${formatAddress(receipt.address)}` : labels.addressMissing,
						{ style: receipt.address ? "normal" : "bold" },
					);
				}
				break;
			case "items":
				for (const item of receipt.items) {
					drawAmountRow(cursor, `${item.quantity}× ${item.productName}`, formatMoney(item.displayTotal), true);
					const groups = new Map<string, string[]>();
					for (const option of item.options) {
						const optionPrice = Number(option.priceDeltaCents);
						const detail = `${option.quantity}× ${option.optionName}${optionPrice ? ` (${formatMoney(optionPrice)})` : ""}`;
						groups.set(option.groupName, [...(groups.get(option.groupName) ?? []), detail]);
					}
					for (const [groupName, options] of groups) {
						drawWrappedText(cursor, `${groupName}: ${options.join(", ")}`, { fontSize: 7.5, indent: 3 });
					}
					if (item.note?.trim()) {
						setTextStyle(doc, 8, "bold");
						const noteLines = doc.splitTextToSize(`${labels.note}: ${item.note}`, CONTENT_WIDTH_MM - 4) as string[];
						const boxHeight = noteLines.length * 3.4 + 2;
						doc.setDrawColor(0, 0, 0);
						doc.rect(RECEIPT_MARGIN_MM + 1, cursor.y - 2.2, CONTENT_WIDTH_MM - 2, boxHeight);
						for (const line of noteLines) {
							doc.text(line, RECEIPT_MARGIN_MM + 3, cursor.y);
							cursor.y += 3.4;
						}
						cursor.y += 2;
					}
					cursor.y += 1;
				}
				break;
			case "payment":
				drawWrappedText(
					cursor,
					receipt.payment
						? `${labels.payment}: ${labels.paymentMethod} · ${labels.paymentStatus}`
						: labels.paymentMissing,
					{ style: "bold" },
				);
				break;
			case "paymentAmount":
				drawAmountRow(cursor, labels.paymentAmount, `-${formatMoney(paidAmount(receipt))}`);
				break;
			case "amountDue":
				drawAmountRow(cursor, labels.amountDue, formatMoney(Math.max(0, Number(receipt.total) - paidAmount(receipt))), true);
				break;
			case "subtotal":
				drawAmountRow(cursor, labels.subtotal, formatMoney(receipt.subtotal));
				break;
			case "deliveryFee":
				drawAmountRow(cursor, labels.deliveryFee, formatMoney(receipt.deliveryFee));
				break;
			case "discount":
				drawAmountRow(cursor, labels.discount, `-${formatMoney(receipt.discountCents)}`);
				break;
			case "cashback":
				drawAmountRow(cursor, labels.cashback, `-${formatMoney(receipt.cashbackCentsRedeemed)}`);
				break;
			case "loyalty":
				drawAmountRow(cursor, labels.loyalty, `-${formatMoney(receipt.loyaltyPointsRedeemed)}`);
				break;
			case "fees": {
				const visibleFees = receipt.fees.filter(fee => fee.displayMode !== "embedded");
				if (visibleFees.length > 0) {
					drawWrappedText(cursor, labels.fees, { style: "bold" });
					for (const fee of visibleFees) drawAmountRow(cursor, fee.name, formatMoney(fee.amountCents));
				}
				break;
			}
			case "total":
				cursor.y += 1;
				drawAmountRow(cursor, labels.total, formatMoney(receipt.total), true);
				break;
			case "preparedBy":
				if (receipt.preparedBy?.name.trim()) {
					drawWrappedText(cursor, `${labels.preparedBy}: ${receipt.preparedBy.name}`);
				}
				break;
			case "separator":
				drawSeparator(cursor, block.separatorStyle === "dashed");
				break;
			case "text": {
				const fontSize = block.size === "small" ? 7 : block.size === "large" ? 11 : 8;
				if (block.content?.trim()) {
					drawWrappedText(cursor, block.content.trim(), {
						align: block.align ?? "left",
						fontSize,
						style: block.bold ? "bold" : "normal",
					});
				}
				break;
			}
		}
		cursor.y += block.type === "separator" ? 0 : 1;
	}

	return cursor.y + RECEIPT_MARGIN_MM;
}

export function createOrderReceiptPdf(
	receipt: GetOrdersByOrderIdReceipt200,
	labels: OrderReceiptLabels,
): jsPDF {
	const measuringDocument = new jsPDF({ format: [RECEIPT_WIDTH_MM, 1000], unit: "mm" });
	const measuredHeight = drawReceipt(measuringDocument, receipt, labels);
	const height = Math.max(MIN_RECEIPT_HEIGHT_MM, Math.ceil(measuredHeight));
	const document = new jsPDF({ format: [RECEIPT_WIDTH_MM, height], orientation: "portrait", unit: "mm" });
	drawReceipt(document, receipt, labels);
	document.viewerPreferences({ PickTrayByPDFSize: true, PrintScaling: "None" });
	return document;
}
