import type { GetCompanies200 } from "@/lib/api";
import template from "./template.html?raw";

type Company = GetCompanies200[number];

export function escapeHtml(value: string) {
	return value.replace(/[&<>"']/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]!);
}

export function createVisualIdentityTemplate(company?: Company) {
	const field = (label: string, value?: string | null) => `<div class="field"><div class="label">${escapeHtml(label)}</div><div contenteditable="true" role="textbox" aria-label="${escapeHtml(label)}">${escapeHtml(value?.trim() || "A preencher")}</div></div>`;
	const section = (title: string, fields: [string, (string | null | undefined)?][]) => `<section><h2>${title}</h2><div class="grid">${fields.map(([label, value]) => field(label, value)).join("")}</div></section>`;
	const sections = [
		section("01 / Sua empresa", [["Nome da empresa / nome no aplicativo", company?.name], ["Identificador (slug)", company?.slug], ["Site do delivery", company?.siteUrl], ["Responsável pelo briefing"], ["Segmento e descrição da marca"], ["Público e personalidade da marca"]]),
		section("02 / Logos e imagens", [["Logo (link ou nome do arquivo)", company?.logoUrl], ["Ícone do aplicativo (quadrado)", company?.mobileIconUrl], ["Imagem padrão das unidades", company?.unitFallbackImageUrl], ["Banners da página inicial (um por linha)", company?.homepageBannerUrls.join("\n")], ["Versões do logo para fundos claros e escuros"], ["Observações sobre imagens e recortes"]]),
		section("03 / Cores e aparência", [["Tema inicial", company ? (company.defaultTheme === "dark" ? "Escuro" : "Claro") : undefined], ["Permitir alternar claro/escuro", company ? (company.allowThemeToggle ? "Sim" : "Não") : undefined], ["Paleta clara (nome: HEX)", company?.themeColors ? JSON.stringify(company.themeColors.light, null, 2) : undefined], ["Paleta escura (nome: HEX)", company?.themeColors ? JSON.stringify(company.themeColors.dark, null, 2) : undefined], ["Cor principal / secundária / destaque (HEX)"], ["Restrições e referências visuais"]]),
		section("04 / Tipografia", [["Fonte de títulos", company?.fontDisplay], ["Arquivo / URL da fonte de títulos", company?.fontDisplayUrl], ["Fonte de textos", company?.fontFamily], ["Arquivo / URL da fonte de textos", company?.fontFamilyUrl]]),
		section("05 / Rodapé e canais públicos", [["Texto do rodapé", company?.footerText], ["WhatsApp público", company?.footerWhatsApp], ["E-mail de suporte", company?.footerSupportEmail], ["Instagram", company?.footerInstagramUrl], ["Facebook", company?.footerFacebookUrl], ["Meios de pagamento exibidos", company?.footerPaymentMethods.join(", ")]]),
		section("06 / Revisão e entrega", [["Arquivos anexados e links para materiais"], ["Observações e pendências"], ["Responsável pela aprovação"], ["Data da revisão"]]),
	].join("\n");
	return template.replace("{{sections}}", () => sections);
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
