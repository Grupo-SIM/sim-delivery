import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useTranslation } from "react-i18next";
import { LuGripVertical } from "react-icons/lu";
import { Button } from "@/components/ui/button";

interface CategoryCardProps {
	category: { id: string; imageUrl: string; name: string };
	onEdit: () => void;
}

export function CategoryCard({ category, onEdit }: CategoryCardProps) {
	const { t } = useTranslation();
	const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
		id: category.id,
	});

	return (
		<div
			className="flex items-center gap-2 rounded-lg border border-border bg-card p-2"
			ref={setNodeRef}
			style={{ opacity: isDragging ? 0.5 : 1, transform: CSS.Transform.toString(transform), transition }}
		>
			<button
				aria-label="drag"
				className="cursor-grab touch-none text-muted-foreground active:cursor-grabbing"
				type="button"
				{...attributes}
				{...listeners}
			>
				<LuGripVertical className="size-4" />
			</button>
			{category.imageUrl ? (
				<img alt={category.name} className="size-9 rounded-md object-cover" src={category.imageUrl} />
			) : (
				<div className="size-9 rounded-md bg-muted" />
			)}
			<span className="min-w-0 flex-1 truncate font-medium text-sm">{category.name}</span>
			<Button onClick={onEdit} size="sm" type="button" variant="outline">
				{t("admin.categories.edit.action")}
			</Button>
		</div>
	);
}
