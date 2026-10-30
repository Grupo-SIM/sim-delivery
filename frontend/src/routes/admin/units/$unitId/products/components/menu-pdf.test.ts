import { describe, expect, it } from "bun:test";
import type { UnitMenuSections } from "./menu-export";
import { menuExportFilename, unitMenuUrl } from "./menu-export";
import { createMenuPdf } from "./menu-pdf";

const item: UnitMenuSections[number]["items"][number] = {
	cashbackPercent: null,
	description: "Chocolate com creme",
	featuredRank: null,
	fromPriceCents: 1000,
	id: "item",
	imageUrl: "",
	optionGroups: [{
		id: "group", name: "Adicionais", allowRepeatSelection: true, required: false,
		maxSelect: null, priceRule: "sum", sortOrder: 0,
		options: [{ id: "option", name: "Granola", description: "Crocante", imageUrl: null, maxPerItem: null, popularity: 0, priceDeltaCents: 250 }],
	}],
	popularity: 0,
	priceCents: 1000,
	productFees: [
		{ id: "embedded", name: "Embutida", applicationScope: "product", displayMode: "embedded", fixedValue: 100, percentageValue: 0 },
		{ id: "explicit", name: "Explicita", applicationScope: "product", displayMode: "product_explicit", fixedValue: 50, percentageValue: 0 },
		{ id: "checkout", name: "SomenteCheckout", applicationScope: "product", displayMode: "checkout_only", fixedValue: 900, percentageValue: 0 },
	],
	productId: "product", productSlug: "sorvete", ratingAverage: null, ratingCount: 0,
	regularPriceCents: 1000, tags: [], title: "Sorvete",
};
const options = {
	companyName: "Sorveteria", unitName: "Centro",
	labels: { title: "Cardapio", from: "A partir de", loose: "Outros", taxes: "Sem taxas" },
};
const sections: UnitMenuSections = [{ categoryId: "category", categoryName: "Sorvetes", items: [item] }];

function content(pdf: ReturnType<typeof createMenuPdf>) {
	return (pdf.internal.pages as unknown as string[][]).flat().join("\n");
}

describe("menu PDF", () => {
	it("exports a real A4 PDF with categories, descriptions and options", () => {
		const pdf = createMenuPdf({ ...options, sections, taxes: false });
		expect(pdf.output().startsWith("%PDF")).toBe(true);
		expect(pdf.internal.pageSize.getWidth()).toBeCloseTo(210, 1);
		for (const text of ["Sorvetes", "Chocolate com creme", "Adicionais", "Granola", "2,50"]) {
			expect(content(pdf)).toContain(text);
		}
	});

	it("respects embedded, explicit and checkout-only fee presentation", () => {
		const plain = content(createMenuPdf({ ...options, sections, taxes: false }));
		const taxed = content(createMenuPdf({ ...options, sections, taxes: true }));
		expect(plain).toContain("10,00");
		expect(plain).not.toContain("Explicita");
		expect(taxed).toContain("11,00");
		expect(taxed).toContain("Explicita");
		expect(taxed).toContain("0,50");
		expect(taxed).not.toContain("SomenteCheckout");
	});

	it("paginates a long menu without dropping the last product or description", () => {
		const pdf = createMenuPdf({ ...options, taxes: false, sections: [{ ...sections[0]!, items: Array.from({ length: 70 }, (_, index) => ({ ...item, id: String(index), title: `Produto ${index}`, description: "Descricao longa ".repeat(index === 69 ? 400 : 8) + `FIM-${index}` })) }] });
		expect(pdf.getNumberOfPages()).toBeGreaterThan(3);
		expect(content(pdf)).toContain("Produto 69");
		expect(content(pdf)).toContain("FIM-69");
		expect(content(pdf)).not.toContain("NaN");
	});
});

describe("menu sharing", () => {
	it("uses the public domain and chosen taxes without inheriting admin query state", () => {
		for (const taxes of [true, false]) {
			const url = new URL(unitMenuUrl("https://loja.example/admin?modal=other", "centro", taxes));
			expect(url.pathname).toBe("/centro");
			expect(url.searchParams.get("menuOnly")).toBe("true");
			expect(url.searchParams.get("taxes")).toBe(String(taxes));
			expect(url.searchParams.has("modal")).toBe(false);
		}
	});

	it("escapes unit slugs and distinguishes exported tax variants", () => {
		expect(new URL(unitMenuUrl("https://loja.example", "loja/centro", false)).pathname).toBe("/loja%2Fcentro");
		expect(menuExportFilename("loja/centro", false, "pdf")).toBe("cardapio-loja-centro-sem-taxas.pdf");
		expect(menuExportFilename("centro", true, "png")).toBe("cardapio-centro-com-taxas.png");
	});
});
