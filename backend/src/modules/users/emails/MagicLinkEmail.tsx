import { Heading, Text } from "@react-email/components";
import { emailBranding } from "@/shared/infra/branding";
import { EmailButton, EmailLayout, emailColors } from "./components";

interface MagicLinkEmailProps {
	url: string;
}

export function MagicLinkEmailTemplate({ url }: MagicLinkEmailProps) {
	return (
		<EmailLayout preview={`Seu link de acesso ao ${emailBranding.companyName}`}>
			<Text
				style={{
					color: emailColors.primary,
					fontSize: "12px",
					fontWeight: "800",
					letterSpacing: "0.08em",
					margin: "0 0 10px",
					textTransform: "uppercase",
				}}
			>
				Acesso seguro
			</Text>
			<Heading
				style={{
					color: emailColors.foreground,
					fontSize: "30px",
					fontWeight: "800",
					letterSpacing: "-0.03em",
					margin: "0 0 12px",
				}}
			>
				Acesse sua conta
			</Heading>

			<Text
				style={{
					color: emailColors.foreground,
					fontSize: "16px",
					lineHeight: "1.6",
					margin: "0 0 28px",
				}}
			>
				Clique no botão abaixo para entrar sem senha.
			</Text>

			<EmailButton href={url}>Entrar</EmailButton>

			<Text
				style={{
					backgroundColor: emailColors.surfaceMuted,
					borderRadius: "12px",
					color: emailColors.muted,
					fontSize: "12px",
					lineHeight: "1.5",
					margin: "28px 0 0",
					padding: "14px 16px",
				}}
			>
				Por segurança, este link expira em 30 minutos e pode ser usado uma única vez. Se não foi você, ignore este e-mail.
			</Text>
		</EmailLayout>
	);
}
