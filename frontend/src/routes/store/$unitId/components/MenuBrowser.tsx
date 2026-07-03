import { useState } from "react";
import { useTranslation } from "react-i18next";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/input";
import { useDebouncedInput } from "@/hooks/use-debounced-input";
import { CategoryNav } from "./CategoryNav";
import { MenuSectionBlock } from "./MenuSectionBlock";
import type { MenuSection } from "./types";

interface MenuBrowserProps {
	sections: MenuSection[];
}

export function MenuBrowser({ sections }: MenuBrowserProps) {
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

			{filtered.length === 0 ? (
				<EmptyState title={query ? t("store.menu.noResults") : t("store.menu.empty")} />
			) : (
				<>
					<CategoryNav sections={filtered} />
					<div className="space-y-6">
						{filtered.map(section => (
							<MenuSectionBlock key={section.categoryId ?? "loose"} section={section} />
						))}
					</div>
				</>
			)}
		</div>
	);
}
