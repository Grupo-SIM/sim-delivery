import { useTranslation } from "react-i18next";
import { MenuItemCard } from "./MenuItemCard";
import { type MenuItem, type MenuSection, sectionAnchor } from "./types";

interface MenuSectionBlockProps {
	section: MenuSection;
	onSelect: (item: MenuItem) => void;
}

export function MenuSectionBlock({ onSelect, section }: MenuSectionBlockProps) {
	const { t } = useTranslation();

	return (
		<section className="menu-section scroll-mt-36 space-y-3" id={sectionAnchor(section.categoryId)}>
			<div className="flex items-center gap-3 border-border border-b pb-3">
				<h2 className="font-semibold text-lg">{section.categoryName ?? t("store.menu.loose")}</h2>
				<span className="rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 font-semibold text-primary text-xs">
					{section.items.length}
				</span>
			</div>
			<div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
				{section.items.map(item => (
					<MenuItemCard item={item} key={item.id} onSelect={onSelect} />
				))}
			</div>
		</section>
	);
}
