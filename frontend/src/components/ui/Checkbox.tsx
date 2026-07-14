import type { ComponentPropsWithRef } from "react";
import { LuCheck } from "react-icons/lu";
import { cn } from "@/lib/utils";

type CheckboxProps = Omit<ComponentPropsWithRef<"input">, "type" | "size">;

export function Checkbox({ className, ref, ...props }: CheckboxProps) {
	return (
		<span className={cn("relative inline-flex h-5 w-5 shrink-0 items-center justify-center", className)}>
			<input
				className="peer absolute inset-0 h-full w-full cursor-pointer appearance-none rounded border border-input bg-surface transition-colors checked:border-primary checked:bg-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 disabled:cursor-not-allowed disabled:opacity-50"
				ref={ref}
				type="checkbox"
				{...props}
			/>
			<LuCheck className="pointer-events-none h-3.5 w-3.5 text-primary-foreground opacity-0 peer-checked:opacity-100" />
		</span>
	);
}
