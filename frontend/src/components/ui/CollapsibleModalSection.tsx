import { type ReactNode, useId, useState } from "react";
import { LuChevronDown } from "react-icons/lu";
import { cn } from "@/lib/utils";

interface CollapsibleModalSectionProps {
	children: ReactNode;
	defaultOpen?: boolean;
	summary: string;
	title: string;
}

/** Collapsible modal section. Collapsed state keeps the section title and concise summary visible. */
export function CollapsibleModalSection({
	children,
	defaultOpen = false,
	summary,
	title,
}: CollapsibleModalSectionProps) {
	const [isOpen, setIsOpen] = useState(defaultOpen);
	const contentId = useId();

	return (
		<section className="border-border border-t pt-6">
			<button
				aria-controls={contentId}
				aria-expanded={isOpen}
				className="flex w-full cursor-pointer items-center justify-between gap-3 rounded-md border border-border px-3 py-2 text-left hover:bg-muted"
				onClick={() => setIsOpen(current => !current)}
				type="button"
			>
				<span className="min-w-0">
					<span className="block font-semibold text-lg">{title}</span>
					<span className="block truncate text-muted-foreground text-sm">{summary}</span>
				</span>
				<LuChevronDown className={cn("size-5 shrink-0 transition-transform", isOpen && "rotate-180")} />
			</button>
			{isOpen && (
				<div className="space-y-4 pt-4" id={contentId}>
					{children}
				</div>
			)}
		</section>
	);
}
