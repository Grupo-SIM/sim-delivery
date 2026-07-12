import { Button, type ButtonProps } from "baseui/button";

type BrandTone = "primary" | "accent" | "cyan" | "whatsapp" | "outline";

interface BrandButtonProps extends Omit<ButtonProps, "kind"> {
	tone?: BrandTone;
	fullWidth?: boolean;
}

/**
 * Rounded, pill-shaped Zero Grau CTA built on Base Web's Button. `tone` maps to the
 * brand's action colors; `outline` is the subtle secondary variant (never borderless).
 */
const toneStyle: Record<BrandTone, Record<string, string>> = {
	accent: {
		backgroundColor: "#FFED00",
		borderColor: "#FFED00",
		color: "#0012FF",
	},
	cyan: {
		backgroundColor: "#00E5FF",
		borderColor: "#00E5FF",
		color: "#062033",
	},
	outline: {
		backgroundColor: "transparent",
		borderColor: "#0012FF",
		color: "#0012FF",
	},
	primary: {
		backgroundColor: "#0012FF",
		borderColor: "#0012FF",
		color: "#FFFFFF",
	},
	whatsapp: {
		backgroundColor: "#25D366",
		borderColor: "#25D366",
		color: "#FFFFFF",
	},
};

export function BrandButton({
	children,
	fullWidth,
	overrides,
	size = "default",
	tone = "primary",
	widthType,
	...props
}: BrandButtonProps) {
	return (
		<Button
			overrides={{
				...overrides,
				BaseButton: {
					...overrides?.BaseButton,
					style: {
						borderRadius: "50px",
						borderStyle: "solid",
						borderWidth: "2px",
						fontWeight: 800,
						letterSpacing: "0.02em",
						minHeight: size === "mini" ? "36px" : "48px",
						paddingInline: "24px",
						transitionDuration: "0.3s",
						transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
						width: fullWidth ? "100%" : undefined,
						...toneStyle[tone],
						":hover": {
							transform: "translateY(-2px)",
							...(tone === "outline"
								? { backgroundColor: "#0012FF", color: "#FFFFFF" }
								: { filter: "brightness(0.94)" }),
						},
					},
				},
			}}
			size={size}
			widthType={widthType ?? (fullWidth ? "fill" : "hug")}
			{...props}
		>
			{children}
		</Button>
	);
}
