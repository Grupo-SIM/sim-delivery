import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { EmptyState } from "@/components/ui/EmptyState";
import { type GetCategories200, useGetUnits } from "@/lib/api";
import { CategoryCard } from "./CategoryCard";
import { CategoryEditModal } from "./CategoryEditModal";
import { UnitCategoryColumn } from "./UnitCategoryColumn";

interface CategoriesBoardProps {
	categories: GetCategories200;
}

export function CategoriesBoard({ categories }: CategoriesBoardProps) {
	const { t } = useTranslation();
	const { data: units } = useGetUnits();
	const [editingCategory, setEditingCategory] = useState<{
		id: string;
		imageUrl: string;
		name: string;
	} | null>(null);
	const [loadedByUnit, setLoadedByUnit] = useState<Record<string, string[]>>({});

	const handleLoaded = useCallback((unitId: string, categoryIds: string[]) => {
		setLoadedByUnit(current =>
			current[unitId]?.join() === categoryIds.join() ? current : { ...current, [unitId]: categoryIds },
		);
	}, []);

	const allLoaded = (units ?? []).every(unit => loadedByUnit[unit.id] !== undefined);
	const linkedCategoryIds = useMemo(() => new Set(Object.values(loadedByUnit).flat()), [loadedByUnit]);
	const orphans =
		units && units.length > 0 && !allLoaded
			? []
			: categories.filter(category => !linkedCategoryIds.has(category.id));

	return (
		<div className="space-y-6">
			{units && units.length > 0 ? (
				<div className="grid gap-4 sm:grid-cols-2">
					{units.map(unit => (
						<UnitCategoryColumn
							key={unit.id}
							onEdit={setEditingCategory}
							onLoaded={handleLoaded}
							unitId={unit.id}
							unitName={unit.name}
						/>
					))}
				</div>
			) : (
				<EmptyState title={t("admin.categories.board.noUnits")} />
			)}

			{orphans.length > 0 && (
				<div className="space-y-2">
					<div>
						<h3 className="font-semibold text-sm">{t("admin.categories.board.unassigned")}</h3>
						<p className="text-muted-foreground text-xs">{t("admin.categories.board.unassignedHint")}</p>
					</div>
					<div className="space-y-2">
						{orphans.map(category => (
							<CategoryCard
								category={category}
								key={category.id}
								onEdit={() => setEditingCategory(category)}
							/>
						))}
					</div>
				</div>
			)}

			<CategoryEditModal
				category={editingCategory}
				onClose={() => setEditingCategory(null)}
				units={units ?? []}
			/>
		</div>
	);
}
