import { render } from "@react-email/components";
import { OrderStatusEmailTemplate } from "@/modules/orders/emails/OrderStatusEmail";
import { BaseEmail } from "./BaseEmail";

interface OrderStatusEmailInput {
	message: string;
	orderNumber: number;
	reviewUrl?: string;
	status: string;
	to: string;
}

const STATUS_LABELS: Record<string, string> = {
	cancelado: "Cancelado",
	em_preparo: "Em preparo",
	entregue: "Entregue",
	pronto: "Pronto",
	recebido: "Recebido",
	retirado: "Retirado",
	saiu_para_entrega: "Saiu para entrega",
};

export class OrderStatusEmail extends BaseEmail {
	private readonly message: string;
	private readonly orderNumber: number;
	private readonly reviewUrl?: string;
	private readonly status: string;

	constructor({ message, orderNumber, reviewUrl, status, to }: OrderStatusEmailInput) {
		super(to);
		this.message = message.replace(new RegExp(`\\s*#${orderNumber}\\b`, "g"), "");
		this.orderNumber = orderNumber;
		this.reviewUrl = reviewUrl;
		this.status = status;
	}

	protected get subject(): string {
		return `Pedido #${this.orderNumber} — ${STATUS_LABELS[this.status] ?? this.status}`;
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
