/**
 * Simpay (SimintPay) client for the Zero Grau tenant.
 *
 * Talks to the back-simpay service, which processes payments through DOM
 * Pagamentos internally. Mirrors the Atlas integration:
 *   POST /zero-grau/payments/credit-card — tokenized card charge
 *   POST /zero-grau/payments/pix         — PIX charge (QR code + copy-paste)
 *   GET  /zero-grau/payments/status/:id  — status from the Simpay DB (webhook-fed)
 *   GET  /zero-grau/payments/pix-status/:id — status straight from DOM (no webhook wait)
 */

import { extractPaymentProviderMessage, PaymentProviderError } from "./paymentProviderError";

export interface SimpayCardPaymentParams {
	price: number;
	document: string;
	document_type: string;
	email: string;
	name: string;
	mobile_phone?: string;
	description: string;
	holder_name: string;
	token: string;
	bin: string;
	brand: string;
	installments: number;
}

export interface SimpayPaymentResponse {
	transactionId: string;
	paymentId: string;
	status: string;
	id?: string;
	message?: string;
	payment_info?: {
		installment_amount: number;
		total_amount: number;
		authorization_code?: string;
	};
}

export interface SimpayPixPaymentParams {
	price: number;
	document: string;
	document_type: string;
	email: string;
	name: string;
	mobile_phone?: string;
	description: string;
}

export interface SimpayPixCreateResponse {
	pix_qrcode: string | null;
	pix_content: string | null;
	/** Fallback image URL for the QR code when `pix_qrcode` is absent. */
	pix_qrcode_url?: string | null;
	id?: string;
	paymentId?: string;
	transactionId?: string;
	/** Present when the gateway declined the charge (e.g. invalid document). */
	status?: string;
	status_details?: string;
	internal_msg?: string;
	message?: string;
}

export interface SimpayMerchantReference {
	cnpj: string;
	externalMerchantId: string;
	legalName: string;
}

export interface SimpayWithdrawalSummary {
	availableBalanceCents: number;
	blockReason: string | null;
	canRequest: boolean;
	feePolicy: { fixedCents: number; percentBasisPoints: number };
	processingCount: number;
	processingGrossCents: number;
}

export interface SimpayWithdrawal {
	createdAt: string;
	feeCents: number;
	grossAmountCents: number;
	id: string;
	netAmountCents: number;
	pixKey: string;
	rejectionReason: string | null;
	requestId: string | null;
	status: string;
	updatedAt: string;
}

export interface SimpayReconciliationResult {
	attributed: number;
	conflicts: string[];
	creditedCents: number;
	dryRun: boolean;
	skipped: number;
}

function resolveBaseUrl(): string {
	const raw = process.env.SIMPAY_API_URL?.trim();
	const fallback = "https://simpay-back.simintermediacoes.com";
	if (!raw) return fallback;
	return raw.replace(/\/+$/, "");
}

const headers = { Accept: "application/json", "Content-Type": "application/json" };

function internalHeaders() {
	return { ...headers, "x-internal-token": process.env.SIMPAY_INTERNAL_TOKEN ?? "" };
}

function merchantBase(merchantId: string): string {
	return `${resolveBaseUrl()}/internal/integrations/sim-delivery/merchants/${encodeURIComponent(merchantId)}`;
}

const APPROVED_PAYMENT_STATUSES = new Set([
	"APPROVED",
	"AUTHORIZED",
	"CAPTURED",
	"CHARGE-APPROVED",
	"COMPLETED",
	"CONFIRMED",
	"PAID",
	"SUCCEEDED",
	"SUCCESS",
]);

const FAILED_PAYMENT_STATUSES = new Set([
	"CANCELED",
	"CANCELLED",
	"CHARGEBACK",
	"EXPIRED",
	"FAILED",
	"NOT_AUTHORIZED",
	"REFUNDED",
	"REJECTED",
]);

function normalizePaymentStatus(status: unknown): string {
	return typeof status === "string" ? status.trim().toUpperCase() : "";
}

export function isApprovedSimpayStatus(status: unknown): boolean {
	return APPROVED_PAYMENT_STATUSES.has(normalizePaymentStatus(status));
}

export function isFailedSimpayStatus(status: unknown): boolean {
	return FAILED_PAYMENT_STATUSES.has(normalizePaymentStatus(status));
}

export class SimpayClient {
	async provisionMerchant(merchant: SimpayMerchantReference): Promise<{ id: string }> {
		const response = await fetch(merchantBase(merchant.externalMerchantId), {
			body: JSON.stringify({ cnpj: merchant.cnpj, legalName: merchant.legalName }),
			headers: internalHeaders(),
			method: "PUT",
		});
		const data = await response.json().catch(() => null);
		if (!response.ok) throw new PaymentProviderError("Simpay", extractPaymentProviderMessage(data) || `Erro ao provisionar merchant (HTTP ${response.status})`, response.status);
		return data as { id: string };
	}

	async createCardPayment(params: SimpayCardPaymentParams, merchant?: SimpayMerchantReference): Promise<SimpayPaymentResponse> {
		if (merchant) await this.provisionMerchant(merchant);
		const response = await fetch(merchant ? `${merchantBase(merchant.externalMerchantId)}/payments/credit-card` : `${resolveBaseUrl()}/zero-grau/payments/credit-card`, {
			body: JSON.stringify(params),
			headers: merchant ? internalHeaders() : headers,
			method: "POST",
		});
		const data = await response.json().catch(() => null);

		if (!response.ok) {
			throw new PaymentProviderError(
				"Simpay",
				extractPaymentProviderMessage(data) || `Erro ao processar pagamento via Simpay (HTTP ${response.status})`,
				response.status,
			);
		}

		return data as SimpayPaymentResponse;
	}

	async createPixPayment(params: SimpayPixPaymentParams, merchant?: SimpayMerchantReference): Promise<SimpayPixCreateResponse> {
		if (merchant) await this.provisionMerchant(merchant);
		const response = await fetch(merchant ? `${merchantBase(merchant.externalMerchantId)}/payments/pix` : `${resolveBaseUrl()}/zero-grau/payments/pix`, {
			body: JSON.stringify(params),
			headers: merchant ? internalHeaders() : headers,
			method: "POST",
		});

		let data: unknown;
		try {
			data = await response.json();
		} catch {
			throw new PaymentProviderError(
				"Simpay",
				`Resposta PIX inválida (HTTP ${response.status}). Confira SIMPAY_API_URL.`,
				response.status,
			);
		}

		if (!response.ok) {
			throw new PaymentProviderError(
				"Simpay",
				extractPaymentProviderMessage(data) || `Erro ao gerar PIX via Simpay (HTTP ${response.status})`,
				response.status,
			);
		}

		return data as SimpayPixCreateResponse;
	}

	async getPaymentStatus(paymentId: string, merchantId?: string): Promise<{ paymentId: string; status: string }> {
		const response = await fetch(
			merchantId
				? `${merchantBase(merchantId)}/payments/${encodeURIComponent(paymentId)}`
				: `${resolveBaseUrl()}/zero-grau/payments/status/${paymentId}`,
			{ headers: merchantId ? internalHeaders() : headers },
		);
		const data = await response.json();

		if (!response.ok) {
			throw new Error(`Erro ao consultar status do pagamento (HTTP ${response.status})`);
		}

		return data as { paymentId: string; status: string };
	}

	async getWithdrawalSummary(merchantId: string): Promise<SimpayWithdrawalSummary> {
		return this.internalJson(`${merchantBase(merchantId)}/finance/summary`);
	}

	async quoteWithdrawal(merchantId: string, grossAmountCents: number): Promise<{ feeCents: number; grossAmountCents: number; netAmountCents: number }> {
		return this.internalJson(`${merchantBase(merchantId)}/finance/withdrawals/quote`, { grossAmountCents });
	}

	async requestWithdrawal(merchantId: string, body: { grossAmountCents: number; pixKey: string; requestId: string }): Promise<SimpayWithdrawal> {
		return this.internalJson(`${merchantBase(merchantId)}/finance/withdrawals`, body);
	}

	async listWithdrawals(merchantId: string, page: number, pageSize: number): Promise<{ items: SimpayWithdrawal[]; meta: { page: number; pageSize: number; totalItems: number; totalPages: number } }> {
		return this.internalJson(`${merchantBase(merchantId)}/finance/withdrawals?page=${page}&pageSize=${pageSize}`);
	}

	async getWithdrawal(merchantId: string, withdrawalId: string): Promise<SimpayWithdrawal> {
		return this.internalJson(`${merchantBase(merchantId)}/finance/withdrawals/${encodeURIComponent(withdrawalId)}`);
	}

	async reconcilePayments(merchantId: string, paymentIds: string[], dryRun: boolean): Promise<SimpayReconciliationResult> {
		return this.internalJson(`${merchantBase(merchantId)}/finance/reconciliation/payments`, { dryRun, paymentIds });
	}

	private async internalJson<T>(url: string, body?: unknown): Promise<T> {
		const response = await fetch(url, {
			...(body === undefined ? {} : { body: JSON.stringify(body), method: "POST" }),
			headers: internalHeaders(),
		});
		const data = await response.json().catch(() => null);
		if (!response.ok) {
			throw new PaymentProviderError("Simpay", extractPaymentProviderMessage(data) || `Erro na API financeira SIM INT PAY (HTTP ${response.status})`, response.status);
		}
		return data as T;
	}

	/** Queries DOM directly through back-simpay, without waiting for the webhook. */
	async getPixStatusDirect(paymentId: string, merchantId?: string): Promise<{ status: string }> {
		if (merchantId) return this.getPaymentStatus(paymentId, merchantId);
		const response = await fetch(`${resolveBaseUrl()}/zero-grau/payments/pix-status/${paymentId}`, {
			headers,
		});
		if (!response.ok) return { status: "UNKNOWN" };
		return (await response.json()) as { status: string };
	}

	/**
	 * Single integration point for gateway-side refunds. back-simpay has no documented
	 * refund endpoint yet, so this always fails until that API is known — callers must
	 * treat the rejection as "not supported" rather than a transient error, and fall back
	 * to a manual refund. Replace the body once the endpoint is confirmed.
	 */
	async refundPayment(_simpayPaymentId: string, _amountCents: number): Promise<{ externalId: string }> {
		throw new Error("REFUND_NOT_SUPPORTED");
	}
}

export const simpay = new SimpayClient();
