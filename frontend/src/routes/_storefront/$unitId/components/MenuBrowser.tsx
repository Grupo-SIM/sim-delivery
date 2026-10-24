import { type ReactNode, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { EmptyState } from "@/components/ui/EmptyState";
import { CategoryNav } from "./CategoryNav";
import { CategorySummary } from "./CategorySummary";
import { MenuSectionBlock } from "./MenuSectionBlock";
import { ProductDetailsModal } from "./ProductDetailsModal";
import { TopPicksCarousel } from "./TopPicksCarousel";
import type { MenuSection } from "./types";

interface MenuBrowserProps {
	header: ReactNode;
	menuOnly?: boolean;
	taxes?: boolean;
	modalNote?: string;
	modalOptions?: string;
	modalProductId?: string;
	onCloseProductModal: () => void;
	onCategoryNavDockedChange: (docked: boolean) => void;
	onOpenProductModal: (productId: string) => void;
	onUpdateProductModal: (options: string | undefined, note: string) => void;
	sections: MenuSection[];
	unitId: string;
	unitSlug: string;
	search: string;
}

export function MenuBrowser({
	header,
	menuOnly = false,
	taxes = true,
	modalNote,
	modalOptions,
	modalProductId,
	onCloseProductModal,
	onCategoryNavDockedChange,
	onOpenProductModal,
	onUpdateProductModal,
	search,
	sections,
	unitId,
	unitSlug,
}: MenuBrowserProps) {
	const { t } = useTranslation();
	const selectedItem = modalProductId
		? (sections.flatMap(section => section.items).find(item => item.id === modalProductId) ?? null)
		: null;
	const updateProductModal = useCallback(
		(options: { optionId: string; quantity: number }[], note: string) => {
			const serializedOptions =
				options.length > 0
					? JSON.stringify(options.map(({ optionId, quantity }) => ({ optionId, quantity })))
					: undefined;
			onUpdateProductModal(serializedOptions, note);
		},
		[onUpdateProductModal],
	);

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
			<div
				className={hasCategories ? "menu-browser lg:grid lg:grid-cols-[12rem_1fr] lg:gap-6" : "menu-browser"}
			>
				{hasCategories && <CategorySummary sections={filtered} />}
				<div className="min-w-0 space-y-6">
					{header}
					{!menuOnly && !query && <TopPicksCarousel taxes={taxes} onSelect={item => onOpenProductModal(item.id)} sections={sections} />}

					{filtered.length === 0 ? (
						<EmptyState title={query ? t("store.menu.noResults") : t("store.menu.empty")} />
					) : (
						<>
							<CategoryNav onDockedChange={onCategoryNavDockedChange} sections={filtered} />
							{filtered.map(section => (
								<MenuSectionBlock
									key={section.categoryId ?? "loose"}
									menuOnly={menuOnly}
									taxes={taxes}
									onSelect={item => onOpenProductModal(item.id)}
									section={section}
								/>
							))}
						</>
					)}
				</div>
			</div>
			<ProductDetailsModal
					historyMode="none"
					initialNote={modalNote}
					initialOptions={modalOptions}
					item={selectedItem}
					onClose={onCloseProductModal}
					onStateChange={menuOnly ? undefined : updateProductModal}
				readOnly={menuOnly}
				taxes={taxes}
					unitId={unitId}
			/>
		</>
	);
}
