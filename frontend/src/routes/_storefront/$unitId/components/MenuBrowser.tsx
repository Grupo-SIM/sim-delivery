import { useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { EmptyState } from "@/components/ui/EmptyState";
import { CategoryNav } from "./CategoryNav";
import { CategorySummary } from "./CategorySummary";
import { MenuSectionBlock } from "./MenuSectionBlock";
import { ProductDetailsModal } from "./ProductDetailsModal";
import { TopPicksCarousel } from "./TopPicksCarousel";
import type { MenuItem, MenuSection } from "./types";

interface MenuBrowserProps {
	header: ReactNode;
	sections: MenuSection[];
	unitId: string;
	unitSlug: string;
	search: string;
}

export function MenuBrowser({ header, search, sections, unitId, unitSlug }: MenuBrowserProps) {
	const { t } = useTranslation();
	const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);

	const query = search.trim().toLowerCase();
	const filtered = query
		? sections
				.map(section => ({
					...section,
					items: section.items.filter(item =>
						`${item.title} ${item.description}`.toLowerCase().includes(query),
					),
				}))
				.filter(section => section.items.length > 0)
		: sections;
	const hasCategories = filtered.some(section => section.categoryId !== null);

	return (
		<>
		<div className={hasCategories ? "lg:grid lg:grid-cols-[12rem_1fr] lg:gap-6" : undefined}>
			{hasCategories && <CategorySummary sections={filtered} />}
			<div className="min-w-0 space-y-6">
				{header}
				{!query && <TopPicksCarousel onSelect={setSelectedItem} sections={sections} />}

				{filtered.length === 0 ? (
					<EmptyState title={query ? t("store.menu.noResults") : t("store.menu.empty")} />
				) : (
					<>
						<div className="lg:hidden">
							<CategoryNav sections={filtered} />
						</div>
						{filtered.map(section => (
							<MenuSectionBlock
								key={section.categoryId ?? "loose"}
								section={section}
								onSelect={setSelectedItem}
							/>
						))}
					</>
				)}
			</div>
		</div>
		<ProductDetailsModal item={selectedItem} onClose={() => setSelectedItem(null)} unitId={unitId} />
		</>
	);
}
