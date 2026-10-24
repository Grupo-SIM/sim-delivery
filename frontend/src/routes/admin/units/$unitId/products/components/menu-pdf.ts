import { jsPDF } from "jspdf";
import { displayedUnitPrice, feeUnitAmount, normalizeProductFees } from "@/lib/platform-fees";
import { hasPriceVariation } from "@/routes/_storefront/$unitId/components/product-options";
import type { UnitMenuSections } from "./menu-export";

export interface MenuPdfLabels {
	title: string;
	from: string;
	loose: string;
	taxes: string;
}

interface MenuPdfOptions {
	companyName: string;
	unitName: string;
	sections: UnitMenuSections;
	taxes: boolean;
	labels: MenuPdfLabels;
	images?: Map<string, string>;
}

export function createMenuPdf({ companyName, unitName, sections, taxes, labels, images }: MenuPdfOptions) {
	const doc = new jsPDF({ compress: true, format: "a4" });
	const margin = 16;
	const right = 194;
	const bottom = 278;
	let y = 0;
	const money = (value: number) => (value / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
	doc.setProperties({ title: `${labels.title} - ${unitName}`, author: companyName });

	function style(size = 10, bold = false, muted = false) {
		doc.setFont("helvetica", bold ? "bold" : "normal");
		doc.setFontSize(size);
		doc.setTextColor(muted ? 95 : 25, muted ? 95 : 25, muted ? 95 : 25);
	}

	function header() {
		style(10, true, true);
		doc.text(companyName, margin, 16);
		style(22, true);
		const titleLines: string[] = doc.splitTextToSize(unitName, right - margin);
		doc.text(titleLines, margin, 27);
		y = 27 + titleLines.length * 8;
		style(9, false, true);
		doc.text(`${labels.title} | ${labels.taxes}`, margin, y);
		y += 4;
		doc.setDrawColor(210);
		doc.line(margin, y, right, y);
		y += 9;
	}

	function ensure(height: number) {
		if (y + height <= bottom) return;
		doc.addPage();
		header();
	}

	function text(
		value: string,
		{ x = margin, width = right - x, size = 10, bold = false, muted = false }: {
			x?: number;
			width?: number;
			size?: number;
			bold?: boolean;
			muted?: boolean;
		} = {},
	) {
		style(size, bold, muted);
		const lines: string[] = doc.splitTextToSize(value, width);
		for (const line of lines) {
			ensure(5);
			style(size, bold, muted);
			doc.text(line, x, y);
			y += 5;
		}
	}

	header();
	for (const section of sections) {
		if (!section.items.length) continue;
		ensure(42);
		style(14, true);
		text(section.categoryName ?? labels.loose, { size: 14, bold: true });
		y += 3;
		for (const item of section.items) {
			ensure(28);
			const top = y;
			const startingPage = doc.getNumberOfPages();
			const image = images?.get(item.imageUrl);
			const x = image ? margin + 26 : margin;
			if (image) doc.addImage(image, "JPEG", margin, top - 3, 21, 21, item.imageUrl, "FAST");
			const fees = normalizeProductFees(taxes ? item.productFees : []);
			const price = `${hasPriceVariation(item.optionGroups) ? `${labels.from} ` : ""}${money(displayedUnitPrice(Number(item.fromPriceCents), fees))}`;
			style(10, true);
			const priceWidth = Math.min(65, doc.getTextWidth(price) + 4);
			doc.text(price, right, y, { align: "right" });
			text(item.title, { x, width: right - x - priceWidth, size: 11, bold: true });
			if (item.description) text(item.description, { x, muted: true, size: 9 });
			for (const fee of fees.filter(fee => fee.displayMode === "product_explicit")) {
				text(`+ ${fee.name}: ${money(feeUnitAmount(Number(item.fromPriceCents), fee))}`, { x, muted: true, size: 9 });
			}
			if (image && startingPage === doc.getNumberOfPages()) y = Math.max(y, top + 21);
			for (const group of item.optionGroups) {
				if (!group.options.length) continue;
				ensure(14);
				y += 2;
				text(group.name, { x: margin + 3, size: 9, bold: true });
				for (const option of group.options) {
					const delta = Number(option.priceDeltaCents);
					text(`${option.name}${delta > 0 ? ` (+ ${money(delta)})` : ""}`, { x: margin + 6, size: 9 });
					if (option.description) text(option.description, { x: margin + 6, size: 8, muted: true });
				}
			}
			y += 3;
			if (y <= bottom) {
				doc.setDrawColor(230);
				doc.line(margin, y, right, y);
			}
			y += 7;
		}
		y += 3;
	}
	const pages = doc.getNumberOfPages();
	for (let page = 1; page <= pages; page++) {
		doc.setPage(page);
		style(8, false, true);
		doc.text(`${page} / ${pages}`, right, 289, { align: "right" });
	}
	return doc;
}
