import { Heading, Text } from "@react-email/components";
import { emailBranding } from "@/shared/infra/branding";
import { EmailButton, EmailLayout, emailColors } from "./components";

interface ResetPasswordEmailProps {
	name: string;
	url: string;
}

export function ResetPasswordEmailTemplate({ name, url }: ResetPasswordEmailProps) {
	return (
		<EmailLayout preview={`Defina sua senha do ${emailBranding.companyName}`}>
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
				Sua conta
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
				Definição de senha
			</Heading>

			<Text
				style={{
					color: emailColors.foreground,
					fontSize: "16px",
					lineHeight: "1.6",
					margin: "0 0 28px",
				}}
			>
				Olá, {name}! Use o link abaixo para definir a senha da sua conta.
			</Text>

			<EmailButton href={url}>Definir senha</EmailButton>

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
				Por segurança, este link expira em 7 dias e pode ser usado uma única vez. Se não foi você, ignore este e-mail.
			</Text>
		</EmailLayout>
	);
}
