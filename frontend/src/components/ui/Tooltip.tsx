import { type ReactNode, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

interface TooltipProps {
	children: ReactNode;
	content: string;
	placement?: "bottom" | "top";
}

/** Small themed tooltip for compact icon controls. */
export function Tooltip({ children, content, placement = "top" }: TooltipProps) {
	const [visible, setVisible] = useState(false);
	const [position, setPosition] = useState({ left: 0, top: 0 });
	const triggerRef = useRef<HTMLSpanElement | null>(null);
	const reducedMotion =
		typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
	const hiddenOffset = placement === "bottom" ? "-8px" : "8px";

	useLayoutEffect(() => {
		if (!visible || !triggerRef.current) return;

		const rect = triggerRef.current.getBoundingClientRect();
		setPosition({
			left: rect.left + rect.width / 2,
			top: placement === "bottom" ? rect.bottom + 8 : rect.top - 8,
		});
	}, [placement, visible]);

	const tooltip =
		typeof document === "undefined"
			? null
			: createPortal(
					<span
						aria-hidden={!visible}
						className={cn(
							"pointer-events-none fixed z-[9999] min-w-[220px] max-w-[320px] rounded-md border border-border bg-popover px-3 py-2 font-medium text-foreground text-xs leading-5 shadow-soft",
							visible ? "opacity-100" : "opacity-0",
						)}
						role="tooltip"
						style={{
							left: position.left,
							top: position.top,
							transform: `translate(-50%, ${placement === "bottom" ? "0" : "-100%"}) translateY(${visible ? "0" : hiddenOffset})`,
							transition: reducedMotion ? "none" : "opacity 200ms ease-out, transform 200ms ease-out",
						}}
					>
						{content}
					</span>,
					document.body,
				);

	return (
		<span
			className="relative inline-flex"
			onBlur={() => setVisible(false)}
			onFocus={() => setVisible(true)}
			onMouseEnter={() => setVisible(true)}
			onMouseLeave={() => setVisible(false)}
			ref={triggerRef}
		>
			{children}
			{tooltip}
		</span>
	);
}
