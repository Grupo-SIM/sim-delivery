import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { type ButtonSize, type ButtonVariant, buttonClassName } from "./button-styles";

interface ButtonProps extends ComponentPropsWithoutRef<"button"> {
	children: ReactNode;
	variant?: ButtonVariant;
	size?: ButtonSize;
}

export function Button({ children, className, size = "md", variant = "default", ...props }: ButtonProps) {
	return (
		<button className={buttonClassName({ className, size, variant })} {...props}>
			{children}
		</button>
	);
}
