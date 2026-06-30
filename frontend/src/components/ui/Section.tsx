import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { cn } from "@/lib/utils";

interface SectionProps extends ComponentPropsWithoutRef<"section"> {
	children: ReactNode;
}

export function Section({ children, className, ...props }: SectionProps) {
	return (
		<section className={cn("py-6 sm:py-8", className)} {...props}>
			{children}
		</section>
	);
}
