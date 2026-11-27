import { useTranslation } from "react-i18next";
import type { MediaGalleryItemData } from "./types";

const VISIBLE_USAGES = 2;

interface MediaGalleryItemProps {
	item: MediaGalleryItemData;
	onSelect: (url: string) => void;
}

export function MediaGalleryItem({ item, onSelect }: MediaGalleryItemProps) {
	const { i18n, t } = useTranslation();
	const date = new Intl.DateTimeFormat(i18n.language, { dateStyle: "short" }).format(new Date(item.lastUsedAt));
	const usages = item.usedBy.slice(0, VISIBLE_USAGES);
	const hiddenUsages = item.usedBy.length - usages.length;

	return (
		<button
			className="flex cursor-pointer flex-col overflow-hidden rounded-md border border-border bg-muted/30 text-left transition-colors hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
			onClick={() => onSelect(item.url)}
			type="button"
		>
			<img alt="" className="aspect-square w-full bg-card object-contain" loading="lazy" src={item.url} />
			<span className="grid gap-0.5 border-border border-t bg-card/90 px-2 py-1.5 text-xs">
				{usages.length === 0 ? (
					<span className="text-muted-foreground">{t("media.gallery.unused")}</span>
				) : (
					usages.map(usage => (
						<span className="truncate" key={`${usage.type}-${usage.name}-${usage.context ?? ""}`}>
							<span className="font-medium">{usage.name}</span>{" "}
							<span className="text-muted-foreground">
								{t(`media.gallery.entity.${usage.type}`, { defaultValue: usage.type })}
								{usage.context ? ` · ${usage.context}` : ""}
							</span>
						</span>
					))
				)}
				{hiddenUsages > 0 && <span className="text-muted-foreground">{t("media.gallery.more", { count: hiddenUsages })}</span>}
				<span className="text-muted-foreground">{date}</span>
			</span>
		</button>
	);
}
