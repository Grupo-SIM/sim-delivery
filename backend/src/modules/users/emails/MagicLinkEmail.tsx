import { Heading, Hr, Text } from "@react-email/components";
import { EmailButton, EmailLayout, emailColors } from "./components";

interface MagicLinkEmailProps {
	url: string;
}

export function MagicLinkEmail({ url }: MagicLinkEmailProps) {
	return (
		<EmailLayout preview="Seu link de acesso ao Template App">
			<Heading
				style={{
					color: emailColors.foreground,
					fontSize: "22px",
					fontWeight: "700",
					margin: "0 0 8px",
				}}
			>
				Acesse sua conta
			</Heading>

			<Text
				style={{
					color: emailColors.foreground,
					fontSize: "15px",
					lineHeight: "1.6",
					margin: "0 0 24px",
				}}
			>
				Clique no botão abaixo para entrar sem senha.
			</Text>

			<EmailButton href={url}>Entrar</EmailButton>

			<Text
				style={{
					color: emailColors.muted,
					fontSize: "13px",
					lineHeight: "1.5",
					margin: "24px 0 0",
				}}
			>
				O link expira em 5 minutos. Se você não solicitou este acesso, ignore este e-mail.
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
