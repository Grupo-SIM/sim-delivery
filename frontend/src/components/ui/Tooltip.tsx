import { type ReactNode, useState } from "react";
import { cn } from "@/lib/utils";

interface TooltipProps {
	children: ReactNode;
	content: string;
}

/** Small themed tooltip for compact icon controls. */
export function Tooltip({ children, content }: TooltipProps) {
	const [visible, setVisible] = useState(false);
	const reducedMotion =
		typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

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
					"pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 max-w-[260px] rounded-md border border-border bg-popover px-2 py-1.5 font-medium text-foreground text-xs leading-5 shadow-soft",
					visible ? "opacity-100" : "opacity-0",
				)}
				role="tooltip"
				style={{
					transform: `translate(-50%, ${visible ? "0" : "8px"})`,
					transition: reducedMotion ? "none" : "opacity 200ms ease-out, transform 200ms ease-out",
				}}
			>
				{content}
			</span>
		</span>
	);
}
