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
		<section className="scroll-mt-16 space-y-3" id={sectionAnchor(section.categoryId)}>
			<h2 className="font-semibold text-lg">{section.categoryName ?? t("store.menu.loose")}</h2>
			<div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
				{section.items.map(item => (
					<MenuItemCard item={item} key={item.id} onSelect={onSelect} />
				))}
			</div>
		</section>
	);
}
