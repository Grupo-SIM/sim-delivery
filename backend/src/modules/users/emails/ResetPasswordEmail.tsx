import { Heading, Hr, Text } from "@react-email/components";
import { EmailButton, EmailLayout, emailColors } from "./components";

interface ResetPasswordEmailProps {
	name: string;
	url: string;
}

export function ResetPasswordEmailTemplate({ name, url }: ResetPasswordEmailProps) {
	return (
		<EmailLayout preview="Defina sua senha do Template App">
			<Heading
				style={{
					color: emailColors.foreground,
					fontSize: "22px",
					fontWeight: "700",
					margin: "0 0 8px",
				}}
			>
				Definição de senha
			</Heading>

			<Text
				style={{
					color: emailColors.foreground,
					fontSize: "15px",
					lineHeight: "1.6",
					margin: "0 0 24px",
				}}
			>
				Olá, {name}! Use o link abaixo para definir a senha da sua conta.
			</Text>

			<EmailButton href={url}>Definir senha</EmailButton>

			<Text
				style={{
					color: emailColors.muted,
					fontSize: "13px",
					lineHeight: "1.5",
					margin: "24px 0 0",
				}}
			>
				O link expira em 7 dias e pode ser usado uma única vez. Se você não solicitou esta ação, ignore este
				e-mail.
			</Text>

			<Hr style={{ borderColor: emailColors.border, margin: "32px 0 24px" }} />

			<Text
				style={{
					color: emailColors.muted,
					fontSize: "12px",
					lineHeight: "1.5",
					margin: "0",
				}}
			>
				© {new Date().getFullYear()} Template App.
			</Text>
		</EmailLayout>
	);
}
