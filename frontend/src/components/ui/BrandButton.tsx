import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { cn } from "@/lib/utils";

type BrandTone = "primary" | "accent" | "secondary" | "whatsapp" | "outline";
interface BrandButtonProps extends ComponentPropsWithoutRef<"button"> {
	tone?: BrandTone;
	fullWidth?: boolean;
	children: ReactNode;
}
const tones: Record<BrandTone, string> = {
	accent: "border-accent bg-accent text-accent-foreground hover:bg-accent/90",
	secondary: "border-secondary bg-secondary text-secondary-foreground hover:bg-secondary/80",
	outline: "border-border bg-transparent text-inherit hover:bg-muted",
	primary: "border-primary bg-primary text-primary-foreground hover:bg-primary/90",
	whatsapp: "border-success bg-success text-success-foreground hover:bg-success/90",
};
export function BrandButton({
	children,
	className,
	fullWidth,
	tone = "primary",
	...props
}: BrandButtonProps) {
	return (
		<button
			className={cn(
				"inline-flex min-h-12 items-center justify-center rounded-full border-2 px-6 font-extrabold tracking-wide transition hover:-translate-y-0.5 disabled:pointer-events-none disabled:opacity-50",
				tones[tone],
				fullWidth && "w-full",
				className,
			)}
			type="button"
			{...props}
		>
			{children}
		</button>
	);
}
