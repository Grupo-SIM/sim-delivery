import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface InfoPillProps {
	children: ReactNode;
	className?: string;
}

export function InfoPill({ children, className }: InfoPillProps) {
	return (
		<span
			className={cn(
				"inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 font-medium text-muted-foreground text-xs",
				className,
			)}
		>
			{children}
		</span>
	);
}
