import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { cn } from "@/lib/utils";

interface LabelProps extends ComponentPropsWithoutRef<"label"> {
	children: ReactNode;
}

export function Label({ children, className, ...props }: LabelProps) {
	return (
		// biome-ignore lint/a11y/noLabelWithoutControl: Callers provide the paired control as children or through htmlFor.
		<label className={cn("grid content-start gap-2 self-start font-medium text-sm leading-none", className)} {...props}>
			{children}
		</label>
	);
}

/** Marks a field as required. Wrap it with the label text in one element, e.g. `<span>{text} <RequiredMark /></span>`, so both stay on the same row inside a grid `Label`. */
export function RequiredMark() {
	return (
		<span aria-hidden className="text-destructive">
			*
		</span>
	);
}
