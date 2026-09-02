import { Button } from "@react-email/components";
import type { ReactNode } from "react";
import { emailColors } from "./theme";

interface EmailButtonProps {
	href: string;
	children: ReactNode;
}

/** Primary CTA button matching the frontend design system. */
export function EmailButton({ children, href }: EmailButtonProps) {
	return (
		<Button
			href={href}
			style={{
				backgroundColor: emailColors.primary,
				border: `1px solid ${emailColors.primary}`,
				borderRadius: "999px",
				color: emailColors.primaryForeground,
				display: "inline-block",
				fontSize: "14px",
				fontWeight: "800",
				letterSpacing: "0",
				padding: "14px 24px",
				textDecoration: "none",
			}}
		>
			{children}
		</Button>
	);
}
