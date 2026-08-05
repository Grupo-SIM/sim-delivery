import { type ReactNode, useId, useState } from "react";
import { useTranslation } from "react-i18next";
import type { IconType } from "react-icons";
import { LuChevronDown } from "react-icons/lu";
import { cn } from "@/lib/utils";
import { IconBadge } from "./IconBadge";

interface CollapsibleSectionProps {
	children: ReactNode;
	defaultOpen?: boolean;
	icon: IconType;
	/** Compact visual hint (swatches, thumbnails) rendered in the header, beside the toggle label. */
	preview?: ReactNode;
	summary: string;
	title: string;
}

/** Page-level collapsible card. Collapsed state keeps the section title and one concise summary visible. */
export function CollapsibleSection({
	children,
	defaultOpen = false,
	icon: Icon,
	preview,
	summary,
	title,
}: CollapsibleSectionProps) {
	const { t } = useTranslation();
	const [isOpen, setIsOpen] = useState(defaultOpen);
	const contentId = useId();

	return (
		<section className="rounded-lg border border-border bg-card text-card-foreground">
			<button
				aria-controls={contentId}
				aria-expanded={isOpen}
				className={cn(
					"flex w-full cursor-pointer items-center gap-3 rounded-lg p-4 text-left transition-colors hover:bg-muted/60",
					isOpen && "rounded-b-none",
				)}
				onClick={() => setIsOpen(current => !current)}
				type="button"
			>
				<IconBadge className="size-10 shrink-0 rounded-md" tone="primary">
					<Icon className="size-5" />
				</IconBadge>
				<span className="min-w-0 flex-1">
					<span className="block font-semibold">{title}</span>
					<span className="block truncate text-muted-foreground text-sm">{summary}</span>
				</span>
				{preview && <span className="hidden shrink-0 items-center gap-2 sm:flex">{preview}</span>}
				<span className="hidden shrink-0 text-muted-foreground text-sm lg:inline">
					{isOpen ? t("actions.minimize") : t("actions.expand")}
				</span>
				<LuChevronDown
					className={cn("size-5 shrink-0 text-muted-foreground transition-transform", isOpen && "rotate-180")}
				/>
			</button>
			{isOpen && (
				<div className="space-y-4 border-border border-t p-4" id={contentId}>
					{children}
				</div>
			)}
		</section>
	);
}
