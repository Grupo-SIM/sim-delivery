import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

type PanelTag = "article" | "aside" | "div" | "dl" | "form" | "li" | "section";

interface PanelProps extends HTMLAttributes<HTMLElement> {
	children: ReactNode;
	active?: boolean;
	as?: PanelTag;
}

export function Panel({ active, as: Component = "div", children, className, ...props }: PanelProps) {
	return (
		<Component
			className={cn(
				"rounded-brand border border-border bg-card text-card-foreground shadow-soft",
				active && "border-primary/60 ring-2 ring-primary/15",
				className,
			)}
			{...props}
		>
			{children}
		</Component>
	);
}
