/**
 * DOM Pagamentos client, used only for customer creation and card tokenization.
 * Charges themselves go through back-simpay (see simpay.ts), mirroring Atlas.
 */

import { extractPaymentProviderMessage, PaymentProviderError } from "./paymentProviderError";

const BASE_URL = "https://apiv3.dompagamentos.com.br/checkout/production";

export interface DomCustomerParams {
	name: string;
	email: string;
	/** Digits only. 11 = CPF, 14 = CNPJ. */
	document: string;
	mobilePhone?: string;
	codeExternal: string;
	address?: {
		street: string;
		number: string;
		city: string;
		state: string;
		zip_code: string;
		neighborhood: string;
	};
}

export interface DomCardTokenParams {
	number: string;
	cvv: string;
	exp_month: number;
	exp_year: number;
	holder_name: string;
	holder_document: string;
}

export interface DomCardTokenResult {
	token: string;
	last4: string;
	brand: string;
	expiryMonth: string;
	expiryYear: string;
	holderName: string;
}

export function detectCardBrand(cardNumber: string): string {
	const number = cardNumber.replace(/\D/g, "");

	if (number.startsWith("4")) return "Visa";
	if (
		number.startsWith("5") ||
		(number.startsWith("2") &&
			Number.parseInt(number.substring(0, 4), 10) >= 2221 &&
			Number.parseInt(number.substring(0, 4), 10) <= 2720)
	) {
		return "Mastercard";
	}
	if (number.startsWith("3")) return "American Express";
	if (number.startsWith("6")) return "Discover";

	return "Unknown";
}

function buildHeaders(): Record<string, string> {
	return {
		Accept: "application/json",
		Authorization: `Bearer ${process.env.DOM_API_KEY}`,
		"Content-Type": "application/json",
	};
}

export class DomPagamentosClient {
	/** Creates (or reuses) a DOM customer; returns its DOM id. */
	async createCustomer(params: DomCustomerParams): Promise<string> {
		const payload = {
			address: params.address,
			code_external: params.codeExternal,
			document: params.document,
			document_type: params.document.length === 11 ? "CPF" : "CNPJ",
			email: params.email,
			mobile_phone: params.mobilePhone,
			name: params.name,
		};

		const response = await fetch(`${BASE_URL}/customers`, {
			body: JSON.stringify(payload),
			headers: buildHeaders(),
			method: "POST",
		});
		const data = (await response.json().catch(() => null)) as { id?: string } | null;

		// DOM answers an error payload carrying the existing id when the customer already exists.
		if (!response.ok && !data?.id) {
			throw new PaymentProviderError(
				"DOM",
				extractPaymentProviderMessage(data) || `Erro ao criar cliente DOM (HTTP ${response.status})`,
				response.status,
			);
		}
		if (!data?.id) throw new PaymentProviderError("DOM", "Resposta DOM sem id de cliente.", response.status);

		return data.id;
	}

	async createCardToken(domCustomerId: string, card: DomCardTokenParams): Promise<DomCardTokenResult> {
		const response = await fetch(`${BASE_URL}/customers/${domCustomerId}/card-token`, {
			body: JSON.stringify(card),
			headers: buildHeaders(),
			method: "POST",
		});
		const data = (await response.json().catch(() => null)) as { token?: string } | null;

		if (!response.ok || !data?.token) {
			throw new PaymentProviderError(
				"DOM",
				extractPaymentProviderMessage(data) || `Erro ao tokenizar cartão (HTTP ${response.status})`,
				response.status,
			);
		}

		return {
			brand: detectCardBrand(card.number),
			expiryMonth: card.exp_month.toString().padStart(2, "0"),
			expiryYear: card.exp_year.toString(),
			holderName: card.holder_name,
			last4: card.number.slice(-4),
			token: data.token,
		};
	}
}

export const domPagamentos = new DomPagamentosClient();
