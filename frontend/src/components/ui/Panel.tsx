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
				"rounded-lg border border-border bg-card text-card-foreground shadow-[0_1px_0_rgba(15,23,42,0.04)]",
				active && "border-primary/70 ring-1 ring-primary/10",
				className,
			)}
			{...props}
		>
			{children}
		</Component>
	);
}
