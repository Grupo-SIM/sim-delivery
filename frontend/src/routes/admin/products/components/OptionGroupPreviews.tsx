import { useTranslation } from "react-i18next";
import { Skeleton } from "@/components/ui/Skeleton";
import { OptionGroupCard } from "./OptionGroupCard";
import type { Product } from "./types";

interface OptionGroupPreviewsProps {
	groups: Product["optionGroups"];
	pending?: boolean;
}

export function OptionGroupPreviews({ groups, pending = false }: OptionGroupPreviewsProps) {
	const { t } = useTranslation();

	if (groups.length === 0) {
		return pending ? (
			<div className="space-y-2">
				<Skeleton className="h-10 w-full" />
				<Skeleton className="h-10 w-full" />
			</div>
		) : (
			<span className="text-muted-foreground text-xs">{t("admin.products.row.none")}</span>
		);
	}

	return (
		<div className="space-y-2">
			{groups.map(group => (
				<OptionGroupCard key={group.id} name={group.name} optionCount={Number(group.optionCount)} />
			))}
		</div>
	);
}
