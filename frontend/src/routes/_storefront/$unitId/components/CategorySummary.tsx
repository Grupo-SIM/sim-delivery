import { useTranslation } from "react-i18next";
import { type MenuSection, sectionAnchor } from "./types";

interface CategorySummaryProps {
	sections: MenuSection[];
}

/** Desktop-only sticky side summary: categories with item counts, jump-to on click (docs/08). */
export function CategorySummary({ sections }: CategorySummaryProps) {
	const { t } = useTranslation();

	function jumpTo(categoryId: string | null) {
		document.getElementById(sectionAnchor(categoryId))?.scrollIntoView({ behavior: "smooth" });
	}

	return (
		<aside className="hidden lg:block">
			<nav className="sticky top-[calc(var(--store-header-height)+1rem)] space-y-1">
				{sections
					.filter(section => section.categoryId !== null)
					.map(section => (
						<button
							className="flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm transition-colors hover:bg-muted hover:text-foreground"
							key={section.categoryId ?? "loose"}
							onClick={() => jumpTo(section.categoryId)}
							type="button"
						>
							<span className="truncate">{section.categoryName ?? t("store.menu.loose")}</span>
							<span className="ml-2 text-muted-foreground text-xs">{section.items.length}</span>
						</button>
					))}
			</nav>
		</aside>
	);
}
