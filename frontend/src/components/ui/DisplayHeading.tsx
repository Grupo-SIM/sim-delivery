import type { ComponentPropsWithoutRef, ElementType, ReactNode } from "react";
import { cn } from "@/lib/utils";

type DisplaySize = "sm" | "md" | "lg" | "xl";

interface DisplayHeadingProps extends ComponentPropsWithoutRef<"h2"> {
	children: ReactNode;
	as?: ElementType;
	size?: DisplaySize;
}

const sizeClassName: Record<DisplaySize, string> = {
	lg: "text-5xl md:text-6xl",
	md: "text-4xl md:text-5xl",
	sm: "text-2xl md:text-3xl",
	xl: "text-6xl md:text-7xl",
};

/**
 * Chunky brand headline set in Luckiest Guy (the storefront display face).
 * Reserve for hero titles and section headers — never body copy.
 */
export function DisplayHeading({
	as: Tag = "h2",
	children,
	className,
	size = "md",
	...props
}: DisplayHeadingProps) {
	return (
		<Tag className={cn("font-display text-primary", sizeClassName[size], className)} {...props}>
			{children}
		</Tag>
	);
}
