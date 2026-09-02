import { Body, Container, Head, Html, Preview, Section, Text } from "@react-email/components";
import type { ReactNode } from "react";
import { emailBranding } from "@/shared/infra/branding";
import { EmailBrandMark } from "./EmailBrandMark";
import { emailColors, emailFontFamily } from "./theme";

interface EmailLayoutProps {
	children: ReactNode;
	preview: string;
	lang?: string;
}

/** Shared storefront-inspired shell for transactional emails. */
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
					padding: "40px 16px",
				}}
			>
				<Container
					style={{
						backgroundColor: emailColors.surface,
						border: `1px solid ${emailColors.border}`,
						borderRadius: "24px",
						margin: "0 auto",
						maxWidth: "560px",
						padding: "0",
						boxShadow: "0 18px 44px rgba(0, 18, 255, 0.16)",
					}}
				>
					<Section
						style={{
							backgroundColor: emailColors.primary,
							borderRadius: "23px 23px 0 0",
							padding: "28px 32px",
						}}
					>
						<EmailBrandMark />
					</Section>
					<Section style={{ padding: "36px 32px" }}>{children}</Section>
					<Section
						style={{
							backgroundColor: emailColors.surfaceMuted,
							borderRadius: "0 0 23px 23px",
							borderTop: `1px solid ${emailColors.border}`,
							padding: "20px 32px 24px",
						}}
					>
						<Text
							style={{
								color: emailColors.muted,
								fontSize: "12px",
								lineHeight: "1.5",
								margin: "0",
							}}
						>
							© {new Date().getFullYear()} {emailBranding.companyName}. Todos os direitos reservados.
						</Text>
					</Section>
				</Container>
			</Body>
		</Html>
	);
}
