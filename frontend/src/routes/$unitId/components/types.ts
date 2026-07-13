import type { GetPublicUnitsByUnitSlugMenu200 } from "@/lib/api";

export type MenuSection = GetPublicUnitsByUnitSlugMenu200[number];
export type MenuItem = MenuSection["items"][number];

export const money = new Intl.NumberFormat("pt-BR", { currency: "BRL", style: "currency" });

/** Stable DOM id for a menu section, used by the quick-nav chips to scroll into view. */
export function sectionAnchor(categoryId: string | null) {
	return `menu-section-${categoryId ?? "loose"}`;
}
