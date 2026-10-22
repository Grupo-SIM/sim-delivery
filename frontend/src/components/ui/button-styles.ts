import { cn } from "@/lib/utils";

type ButtonVariant = "default" | "outline" | "ghost" | "secondary" | "destructive";
type ButtonSize = "sm" | "md" | "lg" | "icon";

const variantClassName: Record<ButtonVariant, string> = {
	default: "border-primary bg-primary text-primary-foreground hover:bg-primary/90",
	destructive: "border-destructive bg-destructive text-destructive-foreground hover:bg-destructive/90",
	ghost: "border-border bg-transparent text-inherit hover:bg-muted",
	outline: "border-border bg-transparent text-inherit hover:bg-muted",
	secondary: "border-secondary bg-secondary text-secondary-foreground hover:bg-secondary/90",
};

const sizeClassName: Record<ButtonSize, string> = {
	icon: "h-9 w-9",
	lg: "h-12 px-6 text-base",
	md: "h-10 px-4 text-sm",
	sm: "h-8 px-3 text-xs",
};

export const buttonBaseClassName =
	"inline-flex cursor-pointer items-center justify-center gap-2 rounded-md border font-semibold transition-[colors,transform] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 active:scale-[0.97]";

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

export type { ButtonSize, ButtonVariant };
