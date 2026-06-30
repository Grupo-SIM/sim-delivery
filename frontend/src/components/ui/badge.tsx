import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { cn } from "@/lib/utils";

interface BadgeProps extends ComponentPropsWithoutRef<"span"> {
	children: ReactNode;
}

export function Badge({ children, className, ...props }: BadgeProps) {
	return (
		<span
			className={cn(
				"inline-flex w-fit items-center rounded border border-primary/30 bg-primary/10 px-2.5 py-1 text-label-bold text-primary",
				className,
			)}
			{...props}
		>
			{children}
		</span>
	);
}
