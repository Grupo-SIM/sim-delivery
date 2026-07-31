import { useTranslation } from "react-i18next";
import { Skeleton } from "@/components/ui/Skeleton";
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
		<div className={pending ? "space-y-2 opacity-70" : "space-y-2"}>
			{groups.map(group => (
				<div className="flex items-center justify-between gap-3 rounded border border-border px-3 py-2" key={group.id}>
					<span className="truncate text-sm">{group.name}</span>
					<span className="shrink-0 text-muted-foreground text-xs">
						{t("admin.products.options.optionCount", { count: Number(group.optionCount) })}
					</span>
				</div>
			))}
		</div>
	);
}
