import { type ReactNode, useState } from "react";
import { cn } from "@/lib/utils";

interface TooltipProps {
	children: ReactNode;
	content: string;
	placement?: "bottom" | "top";
}

/** Small themed tooltip for compact icon controls. */
export function Tooltip({ children, content, placement = "top" }: TooltipProps) {
	const [visible, setVisible] = useState(false);
	const reducedMotion =
		typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
	const verticalClass = placement === "bottom" ? "top-full mt-2" : "bottom-full mb-2";
	const hiddenOffset = placement === "bottom" ? "-8px" : "8px";

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
					"pointer-events-none absolute left-1/2 z-[100] min-w-[220px] max-w-[320px] rounded-md border border-border bg-popover px-3 py-2 font-medium text-foreground text-xs leading-5 shadow-soft",
					verticalClass,
					visible ? "opacity-100" : "opacity-0",
				)}
				role="tooltip"
				style={{
					transform: `translate(-50%, ${visible ? "0" : hiddenOffset})`,
					transition: reducedMotion ? "none" : "opacity 200ms ease-out, transform 200ms ease-out",
				}}
			>
				{content}
			</span>
		</span>
	);
}
