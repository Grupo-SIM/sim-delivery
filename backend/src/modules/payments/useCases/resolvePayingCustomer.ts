import { DomainError } from "@/shared/errors";
import type { PrismaInstance } from "@/shared/infra/sql";
import { PaymentErrors } from "../errors";

export interface PayingCustomerContext {
	customer: {
		id: string;
		cpf: string | null;
		domId: string | null;
		phone: string | null;
	};
	/** Customer document digits. */
	document: string;
	order: { id: string; total: number; unitName: string };
	user: { email: string; id: string; name: string; phoneNumber: string | null };
}

/**
 * Description sent to the payment gateway. The `[Unidade - <name>]` tag lets the
 * Simpay dashboard tell each unit's transactions apart.
 */
export function buildPaymentDescription(order: PayingCustomerContext["order"]): string {
	return `Pedido Zero Grau [Unidade - ${order.unitName}]`;
}

/**
 * Loads the order + customer pair for a payment request, enforcing tenant scoping
 * and order ownership. Persists the customer's CPF when supplied, because payment
 * gateways require the buyer's document for both PIX and card charges.
 */
export async function resolvePayingCustomer(
	prisma: PrismaInstance,
	userId: string,
	data: { cpf?: string; orderId: string; slug: string },
): Promise<PayingCustomerContext> {
	const company = await prisma.company.findUnique({ where: { slug: data.slug } });

	const customer = company
		? await prisma.customer.findFirst({
				include: { user: true },
				where: { companyId: company.id, userId },
			})
		: null;

	const order = await prisma.order.findUnique({
		include: { unit: { select: { name: true } } },
		where: { id: data.orderId },
	});
	if (!order) throw new DomainError(PaymentErrors.ORDER_NOT_FOUND);

	if (!customer || order.customerId !== customer.id) {
		throw new DomainError(PaymentErrors.UNAUTHORIZED_ORDER);
	}

	const bodyCpf = data.cpf?.replace(/\D/g, "");
	let document = customer.cpf?.replace(/\D/g, "") || bodyCpf;
	if (!document) throw new DomainError(PaymentErrors.DOCUMENT_REQUIRED);

	if (!customer.cpf && bodyCpf) {
		await prisma.customer.update({ data: { cpf: bodyCpf }, where: { id: customer.id } });
		document = bodyCpf;
	}

	return {
		customer: {
			cpf: customer.cpf ?? document,
			domId: customer.domId,
			id: customer.id,
			phone: customer.phone,
		},
		document,
		order: { id: order.id, total: order.total, unitName: order.unit.name },
		user: {
			email: customer.user.email,
			id: customer.user.id,
			name: customer.user.name,
			phoneNumber: customer.user.phoneNumber,
		},
	};
}
