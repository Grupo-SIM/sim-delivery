import { type ReactNode, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

interface TooltipProps {
	children: ReactNode;
	content: string;
	open?: boolean;
	placement?: "bottom" | "top";
}

/** Small themed tooltip for compact icon controls. */
export function Tooltip({ children, content, open, placement = "top" }: TooltipProps) {
	const [visible, setVisible] = useState(false);
	const [position, setPosition] = useState({ left: 0, top: 0 });
	const triggerRef = useRef<HTMLSpanElement | null>(null);
	const reducedMotion =
		typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
	const hiddenOffset = placement === "bottom" ? "-8px" : "8px";

	const isVisible = open ?? visible;

	useLayoutEffect(() => {
		if (!isVisible || !triggerRef.current) return;

		const rect = triggerRef.current.getBoundingClientRect();
		setPosition({
			left: rect.left + rect.width / 2,
			top: placement === "bottom" ? rect.bottom + 8 : rect.top - 8,
		});
	}, [isVisible, placement]);

	function canHover() {
		return typeof window !== "undefined" && window.matchMedia("(hover: hover) and (pointer: fine)").matches;
	}

	const tooltip =
		typeof document === "undefined"
			? null
			: createPortal(
					<span
						aria-hidden={!isVisible}
						className={cn(
							"pointer-events-none fixed z-[9999] max-w-[320px] rounded-md border border-border bg-popover px-3 py-2 font-medium text-popover-foreground text-xs leading-5 shadow-soft",
							isVisible ? "opacity-100" : "opacity-0",
						)}
						role="tooltip"
						style={{
							left: position.left,
							top: position.top,
							transform: `translate(-50%, ${placement === "bottom" ? "0" : "-100%"}) translateY(${isVisible ? "0" : hiddenOffset})`,
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
				onFocus={event => {
					if (open !== undefined || !canHover()) return;
					if (event.target instanceof HTMLElement && event.target.matches(":focus-visible")) setVisible(true);
				}}
				onMouseEnter={() => {
					if (open === undefined && canHover()) setVisible(true);
				}}
				onMouseLeave={() => setVisible(false)}
				onPointerDown={() => {
					if (open === undefined) setVisible(false);
				}}
			ref={triggerRef}
		>
			{children}
			{tooltip}
		</span>
	);
}
