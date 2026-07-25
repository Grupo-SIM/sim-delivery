import { BaseEmail } from "./BaseEmail";

interface OrderStatusEmailInput {
	message: string;
	orderId: string;
	status: string;
	to: string;
}

export class OrderStatusEmail extends BaseEmail {
	private readonly message: string;
	private readonly orderId: string;
	private readonly status: string;

	constructor({ message, orderId, status, to }: OrderStatusEmailInput) {
		super(to);
		this.message = message;
		this.orderId = orderId;
		this.status = status;
	}

	protected get subject(): string {
		return `Atualização do pedido ${this.orderId}`;
	}

	protected get text(): string {
		return `${this.message}\n\nStatus: ${this.status}`;
	}
}
