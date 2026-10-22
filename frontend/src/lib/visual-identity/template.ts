import type { GetCompanies200 } from "@/lib/api";
import { type ThemeColors, toThemeVariable } from "@/lib/theme-colors";
import { colorLabels, companyPalette, referenceThemeColors } from "./palette";
import template from "./template.html?raw";

type Company = GetCompanies200[number];

export function escapeHtml(value: string) {
	return value.replace(/[&<>"']/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]!);
}

export function createVisualIdentitySvg(name: string, colors: ThemeColors) {
	const sections = (["light", "dark"] as const).map((mode, modeIndex) => {
		const top = 160 + modeIndex * 700;
		const swatches = Object.entries(colorLabels).map(([token, label], index) => {
			const color = colors[mode][token as keyof typeof colorLabels];
			const x = 48 + (index % 4) * 276;
			const y = top + 56 + Math.floor(index / 4) * 98;
			return `<g><rect data-theme="${mode}" data-token="${token}" x="${x}" y="${y}" width="248" height="44" rx="8" fill="${color}" stroke="#D4D4D4"/><text x="${x}" y="${y + 64}" font-size="13">${label}</text><text x="${x}" y="${y + 83}" font-size="13" fill="#525252">${color}</text></g>`;
		}).join("");
		return `<text x="48" y="${top + 24}" font-size="24" font-weight="700">${mode === "light" ? "Tema claro" : "Tema escuro"}</text>${swatches}`;
	}).join("");
	return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="1580" viewBox="0 0 1200 1580" data-sim-delivery-palette="1"><rect width="1200" height="1580" fill="#FBF6EE"/><g font-family="sans-serif" fill="#1F1513"><text x="48" y="56" font-size="16">SIM DELIVERY / IDENTIDADE VISUAL</text><text x="48" y="108" font-size="36" font-weight="700">${escapeHtml(name.slice(0, 48))}</text>${sections}<text x="48" y="1540" font-size="14">Importe este SVG em Tema e cores para aplicar a paleta. Revise antes de salvar.</text></g></svg>`;
}

export function createVisualIdentityTemplate(company?: Company) {
	const name = company?.name || "Sua marca no SIM Delivery";
	const colors = company ? companyPalette(company.themeColors) : referenceThemeColors;
	const displayFont = company?.fontDisplay || (company ? "Fonte padrão do sistema" : "Rubik");
	const bodyFont = company?.fontFamily || (company ? "Fonte padrão do sistema" : "Nunito Sans");
	const panels = (["light", "dark"] as const).map(mode => {
		const vars = Object.entries(colors[mode]).map(([key, value]) => `--${toThemeVariable(key as keyof typeof colorLabels)}:${value}`).join(";");
		const mainTokens = new Set(["primary", "secondary", "accent", "background", "foreground", "card", "border", "mutedForeground"]);
		const swatches = Object.entries(colorLabels).map(([token, label]) => {
			const color = colors[mode][token as keyof typeof colorLabels];
			return { token, html: `<div class="swatch"><div class="paint" style="background:${color}"></div><span>${label}</span><code>${color}</code></div>` };
		});
		const mainSwatches = swatches.filter(swatch => mainTokens.has(swatch.token)).map(swatch => swatch.html).join("");
		const otherSwatches = swatches.filter(swatch => !mainTokens.has(swatch.token)).map(swatch => swatch.html).join("");
		return `<section class="theme" style="${vars}"><div class="section-title"><h2>${mode === "light" ? "Tema claro" : "Tema escuro"}</h2><span>Paleta e aplicação</span></div><div class="preview"><div class="eyebrow">SEU DELIVERY, SUA IDENTIDADE</div><h3>${escapeHtml(name)}</h3><p>Seus favoritos, com o sabor da sua marca.</p><div class="sample-card"><span class="badge">Destaque</span><h4>Uma experiência feita para você</h4><p>Do primeiro pedido à próxima visita.</p><span class="sample-action">Ver cardápio →</span></div></div><div class="swatches">${mainSwatches}</div><details><summary>Expandir paleta completa</summary><div class="swatches">${otherSwatches}</div></details></section>`;
	}).join("");
	const svg = createVisualIdentitySvg(name, colors);
	const replacements: Record<string, string> = {
		name: escapeHtml(name),
		note: company ? "Identidade atual da empresa no SIM Delivery." : "Referência Estação 237: vinho, dourado e creme. Tema escuro é uma adaptação sugerida.",
		panels,
		fonts: `<div><span>Títulos</span><strong>${escapeHtml(displayFont)}</strong><p>Aa Bb Cc · Sua marca em destaque</p></div><div><span>Textos</span><strong>${escapeHtml(bodyFont)}</strong><p>Uma experiência simples, do pedido à entrega.</p></div>`,
		svg: escapeHtml(svg),
	};
	return template.replace(/\{\{(\w+)\}\}/g, (match, key: string) => replacements[key] ?? match);
}

export function downloadVisualIdentityTemplate(company?: Company) {
	const blob = new Blob([createVisualIdentityTemplate(company)], { type: "text/html;charset=utf-8" });
	const url = URL.createObjectURL(blob);
	const link = document.createElement("a");
	link.href = url;
	link.download = `sim-delivery-identidade-visual-${company?.slug.replace(/[^a-zA-Z0-9_-]/g, "-") || "generico"}.html`;
	link.click();
	setTimeout(() => URL.revokeObjectURL(url), 1000);
}
