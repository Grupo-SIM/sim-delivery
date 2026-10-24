import { useTranslation } from "react-i18next";
import { MenuItemCard } from "./MenuItemCard";
import { type MenuItem, type MenuSection, sectionAnchor } from "./types";

interface MenuSectionBlockProps {
	section: MenuSection;
	onSelect?: (item: MenuItem) => void;
	menuOnly?: boolean;
	taxes?: boolean;
}

export function MenuSectionBlock({ onSelect, section, menuOnly = false, taxes = true }: MenuSectionBlockProps) {
	const { t } = useTranslation();

	return (
		<section className="menu-section scroll-mt-36 space-y-3" id={sectionAnchor(section.categoryId)}>
			<div className="flex items-center gap-3 border-border border-b pb-3">
				<h2 className="font-display text-lg">{section.categoryName ?? t("store.menu.loose")}</h2>
				<span className="rounded-full border border-border bg-muted px-2.5 py-1 font-semibold text-muted-foreground text-xs">
					{section.items.length}
				</span>
			</div>
			<div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
				{section.items.map(item => (
					<MenuItemCard item={item} menuOnly={menuOnly} taxes={taxes} key={item.id} onSelect={onSelect} />
				))}
			</div>
		</section>
	);
}
