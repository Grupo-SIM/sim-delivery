import { render } from "@react-email/components";
import { OrderStatusEmailTemplate } from "@/modules/orders/emails/OrderStatusEmail";
import { BaseEmail } from "./BaseEmail";

interface OrderStatusEmailInput {
	message: string;
	orderId: string;
	orderNumber: number;
	reviewUrl?: string;
	status: string;
	subtitle?: string;
	title?: string;
	to: string;
}

export class OrderStatusEmail extends BaseEmail {
	private readonly message: string;
	private readonly messageIdValue: string;
	private readonly orderNumber: number;
	private readonly reviewUrl?: string;
	private readonly threadId: string;

	private readonly subtitle: string;
	private readonly title: string;

	constructor({ message, orderId, orderNumber, reviewUrl, subtitle = "Acompanhe seu pedido", title, to }: OrderStatusEmailInput) {
		super(to);
		this.message = message.replace(new RegExp(`\\s*#${orderNumber}\\b`, "g"), "");
		const domain = this.getMessageIdDomain();
		this.threadId = `<order-${orderId}@${domain}>`;
		this.messageIdValue = `<order-${orderId}-${crypto.randomUUID()}@${domain}>`;
		this.orderNumber = orderNumber;
		this.reviewUrl = reviewUrl;
		this.subtitle = subtitle;
		this.title = title || `Atualização do pedido #${orderNumber}`;
	}

	protected get subject(): string {
		return `Pedido #${this.orderNumber}`;
	}

	protected override get inReplyTo(): string {
		return this.threadId;
	}

	protected override get messageId(): string {
		return this.messageIdValue;
	}

	protected override get references(): string {
		return this.threadId;
	}

	protected get text(): string {
		return `${this.subtitle}\n${this.title}\n\n${this.message}${this.reviewUrl ? `\n\nAvalie seu pedido: ${this.reviewUrl}` : ""}`;
	}

	protected override get html(): Promise<string> {
		return render(
			OrderStatusEmailTemplate({
				message: this.message,
				reviewUrl: this.reviewUrl,
				subtitle: this.subtitle,
				title: this.title,
			}),
		);
	}

	private getMessageIdDomain(): string {
		const address = process.env.MAIL_FROM ?? process.env.MAIL_USER ?? "localhost";
		const mailbox = address.match(/<([^>]+)>/)?.[1] ?? address;
		return mailbox.split("@")[1]?.trim() || "localhost";
	}
}
