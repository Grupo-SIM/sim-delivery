import { useTranslation } from "react-i18next";
import { ScrollArea } from "@/components/ui/ScrollArea";
import { type MenuSection, sectionAnchor } from "./types";

interface CategoryNavProps {
	sections: MenuSection[];
}

/** Sticky quick-access chips: tapping one scrolls its category section into view. */
export function CategoryNav({ sections }: CategoryNavProps) {
	const { t } = useTranslation();

	if (sections.length <= 1) {
		return null;
	}

	function jumpTo(categoryId: string | null) {
		document.getElementById(sectionAnchor(categoryId))?.scrollIntoView({ behavior: "smooth" });
	}

	return (
		<div className="sticky top-0 z-20 -mx-4 bg-background/90 px-4 py-2 backdrop-blur lg:hidden">
				<ScrollArea className="flex gap-2 overflow-x-auto pb-3">
				{sections
					.filter(section => section.categoryId !== null)
					.map(section => (
						<button
							className="shrink-0 rounded-full border border-border bg-card px-3 py-1 text-sm transition-colors hover:bg-accent hover:text-accent-foreground"
							key={section.categoryId ?? "loose"}
							onClick={() => jumpTo(section.categoryId)}
							type="button"
						>
							{section.categoryName ?? t("store.menu.loose")}
						</button>
					))}
			</ScrollArea>
		</div>
	);
}
