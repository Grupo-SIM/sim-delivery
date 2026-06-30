import type { ComponentPropsWithoutRef } from "react";
import { cn } from "@/lib/utils";

type InputProps = ComponentPropsWithoutRef<"input">;

export function Input({ className, ...props }: InputProps) {
	return (
		<input
			className={cn(
				"flex h-11 w-full rounded border border-input bg-surface px-3 py-2 text-sm transition-colors",
				"placeholder:text-muted-foreground focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
				"disabled:cursor-not-allowed disabled:opacity-50",
				className,
			)}
			{...props}
		/>
	);
}
