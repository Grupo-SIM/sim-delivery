import { DomainError } from "@/shared/errors";
import { isValidDocument } from "@/shared/cpf";
import { simpayIntegrationKey } from "@/shared/infra/simpay";
import type { PrismaInstance } from "@/shared/infra/sql";
import { PaymentErrors } from "../errors";

export interface PayingCustomerContext {
	companyId: string;
	customer: {
		id: string;
		cpf: string | null;
		domId: string | null;
		phone: string | null;
	};
	/** Customer document digits, when required by the payment method. */
	document: string | null;
	merchant: { cnpj: string; externalMerchantId: string; integrationKey: string; legalName: string } | undefined;
	order: { companyName: string; deliveryFee: number; feeTotalCents: number; id: string; total: number; unitName: string };
	user: { email: string; id: string; name: string; phoneNumber: string | null };
}

/** Human-readable company and unit description sent to the payment gateway. */
export function buildPaymentDescription(order: Pick<PayingCustomerContext["order"], "companyName" | "unitName">): string {
	return `Pedido ${order.companyName} - ${order.unitName}`;
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
	options: { requireDocument?: boolean } = {},
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

	if (!company || !customer || order.customerId !== customer.id) {
		throw new DomainError(PaymentErrors.UNAUTHORIZED_ORDER);
	}

	const bodyCpf = data.cpf?.replace(/\D/g, "");
	let document = customer.cpf?.replace(/\D/g, "") || bodyCpf || null;
	if (!document && options.requireDocument !== false) throw new DomainError(PaymentErrors.DOCUMENT_REQUIRED);
	if (document && !isValidDocument(document)) throw new DomainError(PaymentErrors.INVALID_DOCUMENT);
	if (customer.user.name.trim().split(/\s+/).filter(Boolean).length < 2) {
		throw new DomainError(PaymentErrors.NAME_REQUIRED);
	}
	if (customer.phone?.replace(/\D/g, "").length !== 13) {
		throw new DomainError(PaymentErrors.PHONE_REQUIRED);
	}

	if (!customer.cpf && bodyCpf) {
		await prisma.customer.update({ data: { cpf: bodyCpf }, where: { id: customer.id } });
		document = bodyCpf;
	}

	return {
		companyId: company.id,
		customer: {
			cpf: customer.cpf ?? document,
			domId: customer.domId,
			id: customer.id,
			phone: customer.phone,
		},
		document,
		merchant: company?.cnpj
			? { cnpj: company.cnpj, externalMerchantId: company.id, integrationKey: simpayIntegrationKey(company.slug), legalName: company.name }
			: undefined,
		order: { companyName: company.name, deliveryFee: order.deliveryFee ?? 0, feeTotalCents: order.feeTotalCents ?? 0, id: order.id, total: order.total, unitName: order.unit.name },
		user: {
			email: customer.user.email,
			id: customer.user.id,
			name: customer.user.name,
			phoneNumber: customer.user.phoneNumber,
		},
	};
}
