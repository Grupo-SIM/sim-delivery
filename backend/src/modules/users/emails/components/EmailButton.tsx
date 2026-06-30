import { Button } from "@react-email/components";
import type { ReactNode } from "react";
import { emailColors } from "./theme";

interface EmailButtonProps {
	href: string;
	children: ReactNode;
}

/** Primary orange CTA button matching the frontend design system. */
export function EmailButton({ children, href }: EmailButtonProps) {
	return (
		<Button
			href={href}
			style={{
				backgroundColor: emailColors.primary,
				borderRadius: "4px",
				color: emailColors.primaryForeground,
				display: "inline-block",
				fontSize: "14px",
				fontWeight: "800",
				letterSpacing: "0.04em",
				padding: "12px 24px",
				textDecoration: "none",
				textTransform: "uppercase",
			}}
		>
			{children}
		</Button>
	);
}
