import { useState } from "react";
import { useTranslation } from "react-i18next";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/input";
import { useDebouncedInput } from "@/hooks/use-debounced-input";
import { CategoryNav } from "./CategoryNav";
import { CategorySummary } from "./CategorySummary";
import { MenuSectionBlock } from "./MenuSectionBlock";
import { PromoCarousel } from "./PromoCarousel";
import type { MenuSection } from "./types";

interface MenuBrowserProps {
	sections: MenuSection[];
	unitId: string;
}

export function MenuBrowser({ sections, unitId }: MenuBrowserProps) {
	const { t } = useTranslation();
	const [search, setSearch] = useState("");
	const [localSearch, setLocalSearch] = useDebouncedInput(search, setSearch);

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

	return (
		<div className="space-y-4">
			<Input
				onChange={event => setLocalSearch(event.currentTarget.value)}
				placeholder={t("store.menu.searchPlaceholder")}
				value={localSearch}
			/>

			{!query && <PromoCarousel sections={sections} />}

			{filtered.length === 0 ? (
				<EmptyState title={query ? t("store.menu.noResults") : t("store.menu.empty")} />
			) : (
				<div className="lg:grid lg:grid-cols-[12rem_1fr] lg:gap-6">
					<CategorySummary sections={filtered} />
					<div className="min-w-0 space-y-6">
						<div className="lg:hidden">
							<CategoryNav sections={filtered} />
						</div>
						{filtered.map(section => (
							<MenuSectionBlock key={section.categoryId ?? "loose"} section={section} unitId={unitId} />
						))}
					</div>
				</div>
			)}
		</div>
	);
}
