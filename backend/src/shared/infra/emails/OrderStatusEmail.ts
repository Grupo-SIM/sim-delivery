import { render } from "@react-email/components";
import { OrderStatusEmailTemplate } from "@/modules/orders/emails/OrderStatusEmail";
import { BaseEmail } from "./BaseEmail";

interface OrderStatusEmailInput {
	message: string;
	orderNumber: number;
	reviewUrl?: string;
	to: string;
}

export class OrderStatusEmail extends BaseEmail {
	private readonly message: string;
	private readonly orderNumber: number;
	private readonly reviewUrl?: string;

	constructor({ message, orderNumber, reviewUrl, to }: OrderStatusEmailInput) {
		super(to);
		this.message = message.replace(new RegExp(`\\s*#${orderNumber}\\b`, "g"), "");
		this.orderNumber = orderNumber;
		this.reviewUrl = reviewUrl;
	}

	protected get subject(): string {
		return `Atualização do pedido #${this.orderNumber}`;
	}

	protected get text(): string {
		return `${this.message}${this.reviewUrl ? `\n\nAvalie seu pedido: ${this.reviewUrl}` : ""}`;
	}

	protected override get html(): Promise<string> {
		return render(
			OrderStatusEmailTemplate({
				message: this.message,
				orderNumber: this.orderNumber,
				reviewUrl: this.reviewUrl,
			}),
		);
	}
}
