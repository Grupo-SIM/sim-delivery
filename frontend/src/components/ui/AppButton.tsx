import { Button, type ButtonProps } from "baseui/button";

type AppButtonTone = "default" | "destructive" | "secondary" | "tertiary";

interface AppButtonProps extends Omit<ButtonProps, "kind"> {
	fullWidth?: boolean;
	tone?: AppButtonTone;
}

const toneKind: Record<AppButtonTone, ButtonProps["kind"]> = {
	default: "primary",
	destructive: "secondary",
	secondary: "secondary",
	tertiary: "tertiary",
};

export function AppButton({
	children,
	fullWidth,
	overrides,
	size = "compact",
	tone = "default",
	widthType,
	...props
}: AppButtonProps) {
	return (
		<Button
			kind={toneKind[tone]}
			overrides={{
				...overrides,
				BaseButton: {
					...overrides?.BaseButton,
					style: {
						borderRadius: "4px",
						fontSize: "12px",
						fontWeight: 800,
						letterSpacing: "0.04em",
						minHeight: size === "mini" ? "32px" : "40px",
						textTransform: "uppercase",
						width: fullWidth ? "100%" : undefined,
						...(tone === "destructive"
							? {
									borderColor: "var(--destructive)",
									color: "var(--destructive)",
								}
							: {}),
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
