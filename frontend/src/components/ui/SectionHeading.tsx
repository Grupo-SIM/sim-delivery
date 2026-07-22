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
		<div
			className={cn(
				"mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between sm:gap-4",
				className,
			)}
		>
			<div>
				<h2 className="font-bold text-xl leading-tight tracking-tight">{title}</h2>
				{subtitle && <p className="mt-1 text-muted-foreground text-sm">{subtitle}</p>}
			</div>
			{action && <div className="shrink-0">{action}</div>}
		</div>
	);
}
