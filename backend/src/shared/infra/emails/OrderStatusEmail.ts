import { render } from "@react-email/components";
import { OrderStatusEmailTemplate } from "@/modules/orders/emails/OrderStatusEmail";
import { BaseEmail } from "./BaseEmail";

const ORDER_STATUS_LABELS: Record<string, string> = {
	awaiting_payment: "Aguardando pagamento",
	cancelado: "Cancelado",
	em_preparo: "Em preparo",
	entregue: "Entregue",
	problema: "Com problema",
	pronto: "Pronto",
	recebido: "Recebido",
	retirado: "Retirado",
	saiu_para_entrega: "Saiu para entrega",
};

interface OrderStatusEmailInput {
	message: string;
	orderNumber: number;
	reviewUrl?: string;
	status: string;
	to: string;
}

export class OrderStatusEmail extends BaseEmail {
	private readonly message: string;
	private readonly orderNumber: number;
	private readonly reviewUrl?: string;
	private readonly status: string;

	constructor({ message, orderNumber, reviewUrl, status, to }: OrderStatusEmailInput) {
		super(to);
		this.message = message;
		this.orderNumber = orderNumber;
		this.reviewUrl = reviewUrl;
		this.status = status;
	}

	protected get subject(): string {
		return `Atualização do pedido #${this.orderNumber}`;
	}

	protected get text(): string {
		return `${this.message}\n\nStatus: ${this.statusLabel}${this.reviewUrl ? `\n\nAvalie seu pedido: ${this.reviewUrl}` : ""}`;
	}

	protected override get html(): Promise<string> {
		return render(
			OrderStatusEmailTemplate({
				message: this.message,
				orderNumber: this.orderNumber,
				reviewUrl: this.reviewUrl,
				status: this.statusLabel,
			}),
		);
	}

	private get statusLabel(): string {
		return ORDER_STATUS_LABELS[this.status] ?? this.status;
	}
}
