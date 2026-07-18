import { useState } from "react";
import { useTranslation } from "react-i18next";
import { LuUtensilsCrossed } from "react-icons/lu";
import { type MenuSection, sectionAnchor } from "./types";

interface CategoryNavProps {
	sections: MenuSection[];
}

/** Sticky quick-access pills: tapping one scrolls its category section into view. */
export function CategoryNav({ sections }: CategoryNavProps) {
	const { t } = useTranslation();
	const [active, setActive] = useState<string | null>(sections[0]?.categoryId ?? null);

	if (sections.length <= 1) {
		return null;
	}

	function jumpTo(categoryId: string | null) {
		setActive(categoryId);
		document.getElementById(sectionAnchor(categoryId))?.scrollIntoView({ behavior: "smooth" });
	}

	return (
		<div className="scrollbar-none sticky top-0 z-10 -mx-4 flex gap-2 overflow-x-auto bg-background/90 px-4 py-2 backdrop-blur">
			{sections.map(section => {
				const isActive = (section.categoryId ?? "loose") === (active ?? "loose");
				return (
					<button
						className={`flex shrink-0 flex-col items-center gap-1 rounded-2xl border px-4 py-2 font-medium text-sm transition-colors ${
							isActive
								? "border-transparent bg-primary text-primary-foreground"
								: "border-border bg-card hover:bg-accent hover:text-accent-foreground"
						}`}
						key={section.categoryId ?? "loose"}
						onClick={() => jumpTo(section.categoryId)}
						type="button"
					>
						{section.categoryImageUrl ? (
							<img
								alt=""
								className="size-8 rounded-full object-cover"
								loading="lazy"
								src={section.categoryImageUrl}
							/>
						) : (
							<LuUtensilsCrossed
								className={`size-8 rounded-full p-1.5 ${
									isActive
										? "bg-primary-foreground/20 text-primary-foreground"
										: "bg-muted text-muted-foreground"
								}`}
							/>
						)}
						{section.categoryName ?? t("store.menu.loose")}
					</button>
				);
			})}
		</div>
	);
}
