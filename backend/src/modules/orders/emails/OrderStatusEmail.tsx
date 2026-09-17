import { Heading, Text } from "@react-email/components";
import { EmailButton, EmailLayout, emailColors } from "@/modules/users/emails/components";

interface OrderStatusEmailProps {
	message: string;
	reviewUrl?: string;
	subtitle: string;
	title: string;
}

export function OrderStatusEmailTemplate({ message, orderNumber, reviewUrl, subtitle, title }: OrderStatusEmailProps) {
	return (
		<EmailLayout preview={title}>
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
				{subtitle}
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
				{title}
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

			{reviewUrl && <EmailButton href={reviewUrl}>Avaliar pedido</EmailButton>}

		</EmailLayout>
	);
}
