import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Breakpoints above which a section never collapses (its row is side-by-side there). */
const alwaysVisibleFrom = {
	sm: "sm:max-h-[999px] sm:opacity-100",
	md: "md:max-h-[999px] md:opacity-100",
} as const;

interface CollapsibleFormSectionProps extends ComponentPropsWithoutRef<"div"> {
	/** When `true`, the section stays expanded regardless of hover/focus (e.g. any input has state). */
	expanded: boolean;
	/**
	 * Breakpoint from which the section is always visible. Use it for fields that share the
	 * form's first row on wider screens but stack into extra rows on mobile — must match the
	 * row's own `sm:`/`md:` grid breakpoint.
	 */
	visibleFrom?: keyof typeof alwaysVisibleFrom;
	children: ReactNode;
}

/**
 * Rows of a top-of-page form that collapse to a single first row until the user
 * hovers/focuses the form or fills any input. The parent `<form>` must carry the
 * `group` class so `group-hover` / `group-focus-within` reach this element.
 */
export function CollapsibleFormSection({
	expanded,
	visibleFrom,
	className,
	children,
	...props
}: CollapsibleFormSectionProps) {
	return (
		<div
			className={cn(
				"space-y-4 overflow-hidden transition-[max-height,opacity] duration-300 ease-in-out",
				expanded
					? "max-h-[999px] opacity-100"
					: "max-h-0 opacity-0 group-focus-within:max-h-[999px] group-focus-within:opacity-100 group-hover:max-h-[999px] group-hover:opacity-100",
				!expanded && visibleFrom && alwaysVisibleFrom[visibleFrom],
				className,
			)}
			{...props}
		>
			{children}
		</div>
	);
}
