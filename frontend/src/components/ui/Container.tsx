import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { cn } from "@/lib/utils";

interface ContainerProps extends ComponentPropsWithoutRef<"div"> {
	children: ReactNode;
	size?: "sm" | "md" | "lg" | "xl" | "full";
}

const sizeClass: Record<NonNullable<ContainerProps["size"]>, string> = {
	full: "max-w-none",
	lg: "max-w-6xl",
	md: "max-w-5xl",
	sm: "max-w-3xl",
	xl: "max-w-7xl",
};

export function Container({ children, className, size = "xl", ...props }: ContainerProps) {
	return (
		<div className={cn("mx-auto w-full px-4 sm:px-6 lg:px-8", sizeClass[size], className)} {...props}>
			{children}
		</div>
	);
}
