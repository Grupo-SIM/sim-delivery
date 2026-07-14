import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { cn } from "@/lib/utils";

interface CollapsibleFormSectionProps extends ComponentPropsWithoutRef<"div"> {
	/** When `true`, the section stays expanded regardless of hover/focus (e.g. any input has state). */
	expanded: boolean;
	children: ReactNode;
}

/**
 * Rows of a top-of-page form that collapse to a single first row until the user
 * hovers/focuses the form or fills any input. The parent `<form>` must carry the
 * `group` class so `group-hover` / `group-focus-within` reach this element.
 */
export function CollapsibleFormSection({ expanded, className, children, ...props }: CollapsibleFormSectionProps) {
	return (
		<div
			className={cn(
				"space-y-4 overflow-hidden transition-[max-height,opacity] duration-300 ease-in-out",
				expanded
					? "max-h-[999px] opacity-100"
					: "max-h-0 opacity-0 group-focus-within:max-h-[999px] group-focus-within:opacity-100 group-hover:max-h-[999px] group-hover:opacity-100",
				className,
			)}
			{...props}
		>
			{children}
		</div>
	);
}
