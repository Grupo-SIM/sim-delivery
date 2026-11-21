import { type ReactNode, useId, useState } from "react";
import { useTranslation } from "react-i18next";
import { LuChevronDown } from "react-icons/lu";
import { cn } from "@/lib/utils";

interface OrdersMobileSectionProps {
	children: ReactNode;
	count: number;
	defaultOpen: boolean;
	summary?: string;
	title: ReactNode;
}

export function OrdersMobileSection({ children, count, defaultOpen, summary, title }: OrdersMobileSectionProps) {
	const { t } = useTranslation();
	const [isOpen, setIsOpen] = useState(defaultOpen);
	const contentId = useId();

	return (
		<section className="rounded-lg border border-border bg-muted/35">
			<button
				aria-controls={contentId}
				aria-expanded={isOpen}
				aria-label={`${isOpen ? t("actions.minimize") : t("actions.expand")}`}
				className="flex w-full cursor-pointer items-center gap-3 p-3 text-left"
				onClick={() => setIsOpen(current => !current)}
				type="button"
			>
				<span className="min-w-0 flex-1">
					<span className="block">{title}</span>
					{summary && <span className="mt-0.5 block truncate text-muted-foreground text-xs">{summary}</span>}
				</span>
				<span className="shrink-0 rounded-md bg-background px-2 py-0.5 font-semibold text-sm shadow-sm">
					{count}
				</span>
				<LuChevronDown
					aria-hidden
					className={cn("size-5 shrink-0 text-muted-foreground transition-transform", isOpen && "rotate-180")}
				/>
			</button>
			{isOpen && (
				<div className="space-y-2 px-3 pb-3" id={contentId}>
					{children}
				</div>
			)}
		</section>
	);
}
