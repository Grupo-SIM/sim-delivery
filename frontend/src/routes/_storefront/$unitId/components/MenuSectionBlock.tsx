import { useTranslation } from "react-i18next";
import { MenuItemCard } from "./MenuItemCard";
import { type MenuSection, sectionAnchor } from "./types";

interface MenuSectionBlockProps {
	section: MenuSection;
	unitId: string;
	unitSlug: string;
}

export function MenuSectionBlock({ section, unitId, unitSlug }: MenuSectionBlockProps) {
	const { t } = useTranslation();

	return (
		<section className="scroll-mt-16 space-y-3" id={sectionAnchor(section.categoryId)}>
			<h2 className="font-semibold text-lg">{section.categoryName ?? t("store.menu.loose")}</h2>
			<div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
				{section.items.map(item => (
					<MenuItemCard item={item} key={item.id} unitId={unitId} unitSlug={unitSlug} />
				))}
			</div>
		</section>
	);
}
