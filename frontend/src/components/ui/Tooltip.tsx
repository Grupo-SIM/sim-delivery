import { type ReactNode, useState } from "react";
import { cn } from "@/lib/utils";

interface TooltipProps {
	children: ReactNode;
	content: string;
}

/** Small themed tooltip for compact icon controls. */
export function Tooltip({ children, content }: TooltipProps) {
	const [visible, setVisible] = useState(false);

	return (
		<span
			className="relative inline-flex"
			onBlur={() => setVisible(false)}
			onFocus={() => setVisible(true)}
			onMouseEnter={() => setVisible(true)}
			onMouseLeave={() => setVisible(false)}
		>
			{children}
			<span
				aria-hidden={!visible}
				className={cn(
					"pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 w-max -translate-x-1/2 rounded-md border border-border bg-popover px-2 py-1 font-medium text-foreground text-xs shadow-soft transition-[opacity,transform] duration-100 ease-out motion-reduce:transition-none",
					visible ? "translate-y-0 opacity-100" : "translate-y-0.5 opacity-0",
				)}
				role="tooltip"
			>
				{content}
			</span>
		</span>
	);
}
