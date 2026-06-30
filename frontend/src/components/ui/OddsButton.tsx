import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { LuArrowDown, LuArrowUp } from "react-icons/lu";
import { cn } from "@/lib/utils";

type PriceMovement = "up" | "down" | "none";

interface OddsButtonProps extends ComponentPropsWithoutRef<"button"> {
	/** Market label, e.g. "1", "X", "2", "Over 2.5". */
	label: ReactNode;
	/** Decimal odds value, e.g. "2.10". */
	odds: ReactNode;
	/** Whether this selection is currently in the bet slip. */
	selected?: boolean;
	/** Short-lived price-change indicator. */
	movement?: PriceMovement;
}

const movementClass: Record<PriceMovement, string> = {
	down: "text-live",
	none: "",
	up: "text-success",
};

/**
 * The most critical component of the betting UI (DESIGN.md):
 * dark background with cool-gray text at rest; flips to vivid orange with
 * white text when selected; shows an up/down arrow on price movement.
 */
export function OddsButton({
	className,
	label,
	movement = "none",
	odds,
	selected = false,
	...props
}: OddsButtonProps) {
	return (
		<button
			aria-pressed={selected}
			className={cn(
				"flex min-w-16 flex-col items-center justify-center gap-0.5 rounded border px-3 py-2 transition-colors",
				"focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background",
				"disabled:pointer-events-none disabled:opacity-50",
				selected
					? "border-transparent bg-primary text-primary-foreground"
					: "border-[#d9e2f2] bg-[#f8fafc] text-secondary hover:border-primary hover:bg-white",
				className,
			)}
			{...props}
		>
			<span className="text-label-sm uppercase opacity-80">{label}</span>
			<span className={cn("inline-flex items-center gap-0.5 text-odds", !selected && "text-success")}>
				{odds}
				{movement === "up" && (
					<LuArrowUp aria-hidden className={cn("size-3", selected ? "" : movementClass.up)} />
				)}
				{movement === "down" && (
					<LuArrowDown aria-hidden className={cn("size-3", selected ? "" : movementClass.down)} />
				)}
			</span>
		</button>
	);
}
