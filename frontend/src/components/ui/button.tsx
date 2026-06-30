import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { cn } from "@/lib/utils";

type ButtonVariant = "default" | "outline" | "ghost" | "secondary" | "destructive";
type ButtonSize = "sm" | "md" | "lg" | "icon";

interface ButtonProps extends ComponentPropsWithoutRef<"button"> {
	children: ReactNode;
	variant?: ButtonVariant;
	size?: ButtonSize;
}

const variantClassName: Record<ButtonVariant, string> = {
	default: "border-transparent bg-primary text-primary-foreground hover:bg-primary/90",
	destructive: "border-transparent bg-destructive text-white hover:bg-destructive/90",
	ghost: "border-border bg-transparent text-foreground hover:bg-accent hover:text-accent-foreground",
	outline: "border-border bg-transparent text-foreground hover:bg-accent hover:text-accent-foreground",
	secondary: "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/90",
};

const sizeClassName: Record<ButtonSize, string> = {
	icon: "h-9 w-9",
	lg: "h-12 px-6 text-base",
	md: "h-10 px-4 text-sm",
	sm: "h-8 px-3 text-xs",
};

export const buttonBaseClassName =
	"inline-flex items-center justify-center gap-2 rounded border font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50";

export function buttonClassName({
	variant = "default",
	size = "md",
	className,
}: {
	variant?: ButtonVariant;
	size?: ButtonSize;
	className?: string;
}) {
	return cn(buttonBaseClassName, variantClassName[variant], sizeClassName[size], className);
}

export function Button({ children, className, size = "md", variant = "default", ...props }: ButtonProps) {
	return (
		<button className={buttonClassName({ className, size, variant })} {...props}>
			{children}
		</button>
	);
}
