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
					padding: "40px 0",
				}}
			>
				<Container
					style={{
						backgroundColor: emailColors.surface,
						border: `1px solid ${emailColors.border}`,
						borderRadius: "8px",
						margin: "0 auto",
						maxWidth: "480px",
						overflow: "hidden",
						padding: "0",
					}}
				>
					<Section
						style={{
							backgroundColor: emailColors.surfaceDark,
							padding: "24px 32px",
						}}
					>
						<EmailBrandMark />
					</Section>
					<Section style={{ padding: "32px" }}>{children}</Section>
				</Container>
			</Body>
		</Html>
	);
}
