import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { Button } from "./button";

type AppButtonTone = "default" | "destructive" | "secondary" | "tertiary";
interface AppButtonProps extends ComponentPropsWithoutRef<"button"> {
	fullWidth?: boolean;
	tone?: AppButtonTone;
	children: ReactNode;
}
export function AppButton({ children, className, fullWidth, tone = "default", ...props }: AppButtonProps) {
	const variant =
		tone === "default"
			? "default"
			: tone === "secondary"
				? "secondary"
				: tone === "destructive"
					? "destructive"
					: "outline";
	return (
		<Button
			className={`min-h-10 rounded-md text-xs uppercase tracking-[0.04em] ${fullWidth ? "w-full" : ""} ${className ?? ""}`}
			type="button"
			variant={variant}
			{...props}
		>
			{children}
		</Button>
	);
}
