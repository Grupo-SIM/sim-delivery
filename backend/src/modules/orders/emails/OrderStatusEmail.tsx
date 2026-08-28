import { Heading, Hr, Text } from "@react-email/components";
import { emailBranding } from "@/shared/infra/branding";
import { EmailButton, EmailLayout, emailColors } from "@/modules/users/emails/components";

interface OrderStatusEmailProps {
	message: string;
	orderNumber: number;
	reviewUrl?: string;
	status: string;
}

export function OrderStatusEmailTemplate({ message, orderNumber, reviewUrl, status }: OrderStatusEmailProps) {
	return (
		<EmailLayout preview={`Atualização do pedido #${orderNumber}`}>
			<Heading
				style={{
					color: emailColors.foreground,
					fontSize: "22px",
					fontWeight: "700",
					margin: "0 0 8px",
				}}
			>
				Atualização do pedido #{orderNumber}
			</Heading>

			<Text
				style={{
					color: emailColors.foreground,
					fontSize: "15px",
					lineHeight: "1.6",
					margin: "0 0 24px",
				}}
			>
				{message}
			</Text>

			<Text
				style={{
					color: emailColors.muted,
					fontSize: "13px",
					lineHeight: "1.5",
					margin: "0",
				}}
			>
				Status: {status}
			</Text>

			{reviewUrl && <EmailButton href={reviewUrl}>Avaliar pedido</EmailButton>}

			<Hr style={{ borderColor: emailColors.border, margin: "32px 0 24px" }} />

			<Text
				style={{
					color: emailColors.muted,
					fontSize: "12px",
					lineHeight: "1.5",
					margin: "0",
				}}
			>
				© {new Date().getFullYear()} {emailBranding.companyName}.
			</Text>
		</EmailLayout>
	);
}
