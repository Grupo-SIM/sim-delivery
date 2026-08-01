import { type ComponentPropsWithoutRef, forwardRef } from "react";
import { cn } from "@/lib/utils";

type ScrollAreaProps = ComponentPropsWithoutRef<"div">;

export const ScrollArea = forwardRef<HTMLDivElement, ScrollAreaProps>(function ScrollArea(
	{ className, ...props },
	ref,
) {
	return <div className={cn("scrollbar-themed", className)} ref={ref} {...props} />;
});
