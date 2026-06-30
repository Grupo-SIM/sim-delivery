import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface SectionHeadingProps {
	title: ReactNode;
	subtitle?: ReactNode;
	action?: ReactNode;
	className?: string;
}

export function SectionHeading({ title, subtitle, action, className }: SectionHeadingProps) {
	return (
		<div className={cn("mb-4 flex items-end justify-between gap-4", className)}>
			<div>
				<h2 className="text-headline-md">{title}</h2>
				{subtitle && <p className="mt-1 text-body-sm text-muted-foreground">{subtitle}</p>}
			</div>
			{action && <div className="shrink-0">{action}</div>}
		</div>
	);
}
