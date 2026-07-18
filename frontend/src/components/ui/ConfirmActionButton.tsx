import { type ComponentPropsWithoutRef, type ReactNode, useEffect, useState } from "react";
import { LuCheck } from "react-icons/lu";
import { Button } from "@/components/ui/button";
import { Tooltip } from "@/components/ui/Tooltip";

interface ConfirmActionButtonProps extends Omit<ComponentPropsWithoutRef<typeof Button>, "children" | "onClick"> {
	children: ReactNode;
	confirmation: string;
	confirmLabel: string;
	confirmIcon?: ReactNode;
	idleIcon?: ReactNode;
	onConfirm: () => void;
	tooltip?: string;
}

/** Two-click destructive action with an anchored confirmation tooltip. */
export function ConfirmActionButton({
	children,
	confirmation,
	confirmLabel,
	confirmIcon,
	idleIcon,
	onConfirm,
	tooltip,
	...buttonProps
}: ConfirmActionButtonProps) {
	const [confirming, setConfirming] = useState(false);

	useEffect(() => {
		if (!confirming) return;

		const timeout = window.setTimeout(() => setConfirming(false), 3_000);
		return () => window.clearTimeout(timeout);
	}, [confirming]);

	function handleClick() {
		if (!confirming) {
			setConfirming(true);
			return;
		}

		setConfirming(false);
		onConfirm();
	}

	return (
		<Tooltip content={confirming ? confirmation : (tooltip ?? String(children))} open={confirming || undefined}>
			<Button {...buttonProps} aria-label={confirming ? confirmLabel : buttonProps["aria-label"]} onClick={handleClick}>
				{confirming ? (confirmIcon ?? <LuCheck className="size-4" />) : idleIcon}
				{confirming ? (buttonProps.size === "icon" ? null : confirmLabel) : children}
			</Button>
		</Tooltip>
	);
}
