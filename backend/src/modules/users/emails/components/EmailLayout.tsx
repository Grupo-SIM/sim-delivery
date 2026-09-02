import { Body, Container, Head, Html, Preview, Section } from "@react-email/components";
import type { ReactNode } from "react";
import { EmailBrandMark } from "./EmailBrandMark";
import { emailColors, emailFontFamily } from "./theme";

interface EmailLayoutProps {
	children: ReactNode;
	preview: string;
	lang?: string;
}

/** Shared light-first Kinetic Velocity shell for transactional emails. */
export function EmailLayout({ children, lang = "pt-BR", preview }: EmailLayoutProps) {
	return (
		<Html lang={lang}>
			<Head />
			<Preview>{preview}</Preview>
			<Body
				style={{
					backgroundColor: emailColors.background,
					fontFamily: emailFontFamily,
					margin: "0",
					padding: "48px 16px",
				}}
			>
				<Container
					style={{
						backgroundColor: emailColors.surface,
						border: `1px solid ${emailColors.border}`,
						borderRadius: "16px",
						margin: "0 auto",
						maxWidth: "560px",
						overflow: "hidden",
						padding: "0",
						boxShadow: "0 12px 32px rgba(0, 18, 255, 0.10)",
					}}
				>
					<Section
						style={{
							backgroundColor: emailColors.surface,
							borderBottom: `1px solid ${emailColors.border}`,
							borderTop: `4px solid ${emailColors.primary}`,
							padding: "24px 32px 20px",
						}}
					>
						<EmailBrandMark />
					</Section>
					<Section style={{ padding: "36px 32px 32px" }}>{children}</Section>
				</Container>
			</Body>
		</Html>
	);
}
