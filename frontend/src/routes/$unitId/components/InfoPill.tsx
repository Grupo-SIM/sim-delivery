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
				"inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-muted-foreground text-xs font-medium",
				className,
			)}
		>
			{children}
		</span>
	);
}
