import { Heading, Text } from "@react-email/components";
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
				Acompanhe seu pedido
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
				Atualização do pedido #{orderNumber}
			</Heading>

			<Text
				style={{
					color: emailColors.foreground,
					fontSize: "16px",
					lineHeight: "1.6",
					margin: "0 0 28px",
				}}
			>
				{message}
			</Text>

			<Text
				style={{
					backgroundColor: emailColors.surfaceMuted,
					border: `1px solid ${emailColors.border}`,
					borderRadius: "12px",
					color: emailColors.foreground,
					fontSize: "14px",
					fontWeight: "700",
					lineHeight: "1.5",
					margin: "0 0 28px",
					padding: "14px 16px",
				}}
			>
				Status: {status}
			</Text>

			{reviewUrl && <EmailButton href={reviewUrl}>Avaliar pedido</EmailButton>}

		</EmailLayout>
	);
}
