/**
 * SIM INT PAY client. New charges use authenticated company-scoped merchant
 * endpoints with explicit merchant/platform allocation. Legacy Zero Grau status
 * endpoints remain available for payments created before merchant provisioning.
 */

import { extractPaymentProviderMessage, PaymentProviderError } from "./paymentProviderError";

export interface SimpayPaymentAllocation {
	merchantAmountCents: number;
	platformFeeCents: number;
}

export interface SimpayCardPaymentParams {
	allocation: SimpayPaymentAllocation;
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
	allocation: SimpayPaymentAllocation;
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
	integrationKey: string;
	legalName: string;
}

export interface SimpayMerchantScope {
	externalMerchantId: string;
	integrationKey: string;
}

export function simpayIntegrationKey(companySlug: string): string {
	return `sim-delivery_${companySlug}`;
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

function merchantBase(merchant: SimpayMerchantScope): string {
	return `${resolveBaseUrl()}/internal/integrations/${encodeURIComponent(merchant.integrationKey)}/merchants/${encodeURIComponent(merchant.externalMerchantId)}`;
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
	async provisionPlatform(merchant: SimpayMerchantScope, legalName: string): Promise<{ id: string; status: "PENDING_OWNER" | "READY" }> {
		const response = await fetch(`${merchantBase(merchant)}/platform`, {
			body: JSON.stringify({ legalName }),
			headers: internalHeaders(),
			method: "PUT",
		});
		const data = await response.json().catch(() => null);
		if (!response.ok) throw new PaymentProviderError("Simpay", extractPaymentProviderMessage(data) || `Erro ao reservar plataforma (HTTP ${response.status})`, response.status);
		return data as { id: string; status: "PENDING_OWNER" | "READY" };
	}

	async provisionOwner(merchant: SimpayMerchantScope, owner: { cnpj?: string | null; email: string; legalName: string; password?: string }): Promise<{ id: string }> {
		const response = await fetch(`${merchantBase(merchant)}/owner`, {
			body: JSON.stringify(owner),
			headers: internalHeaders(),
			method: "PUT",
		});
		const data = await response.json().catch(() => null);
		if (!response.ok) throw new PaymentProviderError("Simpay", extractPaymentProviderMessage(data) || `Erro ao cadastrar dono (HTTP ${response.status})`, response.status);
		return data as { id: string };
	}

	async provisionMerchant(merchant: SimpayMerchantReference): Promise<{ id: string }> {
		const response = await fetch(merchantBase(merchant), {
			body: JSON.stringify({ cnpj: merchant.cnpj, legalName: merchant.legalName }),
			headers: internalHeaders(),
			method: "PUT",
		});
		const data = await response.json().catch(() => null);
		if (!response.ok) throw new PaymentProviderError("Simpay", extractPaymentProviderMessage(data) || `Erro ao provisionar merchant (HTTP ${response.status})`, response.status);
		return data as { id: string };
	}

	async createCardPayment(params: SimpayCardPaymentParams, merchant?: SimpayMerchantReference): Promise<SimpayPaymentResponse> {
		if (!merchant) throw new PaymentProviderError("Simpay", "Configure o CPF/CNPJ e a carteira da empresa antes de receber pagamentos online.", 422);
		await this.provisionMerchant(merchant);
		const response = await fetch(`${merchantBase(merchant)}/payments/credit-card`, {
			body: JSON.stringify(params),
			headers: internalHeaders(),
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
		if (!merchant) throw new PaymentProviderError("Simpay", "Configure o CPF/CNPJ e a carteira da empresa antes de receber pagamentos online.", 422);
		await this.provisionMerchant(merchant);
		const response = await fetch(`${merchantBase(merchant)}/payments/pix`, {
			body: JSON.stringify(params),
			headers: internalHeaders(),
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

	async getPaymentStatus(paymentId: string, merchant?: SimpayMerchantScope): Promise<{ paymentId: string; status: string }> {
		const response = await fetch(
			merchant
				? `${merchantBase(merchant)}/payments/${encodeURIComponent(paymentId)}`
				: `${resolveBaseUrl()}/zero-grau/payments/status/${paymentId}`,
			{ cache: "no-store", headers: merchant ? internalHeaders() : headers, signal: AbortSignal.timeout(8_000) },
		);
		const data = await response.json();

		if (!response.ok) {
			throw new Error(`Erro ao consultar status do pagamento (HTTP ${response.status})`);
		}

		return data as { paymentId: string; status: string };
	}

	async getWithdrawalSummary(merchant: SimpayMerchantScope): Promise<SimpayWithdrawalSummary> {
		return this.internalJson(`${merchantBase(merchant)}/finance/summary`);
	}

	async quoteWithdrawal(merchant: SimpayMerchantScope, grossAmountCents: number): Promise<{ feeCents: number; grossAmountCents: number; netAmountCents: number }> {
		return this.internalJson(`${merchantBase(merchant)}/finance/withdrawals/quote`, { grossAmountCents });
	}

	async requestWithdrawal(merchant: SimpayMerchantScope, body: { grossAmountCents: number; pixKey: string; requestId: string }): Promise<SimpayWithdrawal> {
		return this.internalJson(`${merchantBase(merchant)}/finance/withdrawals`, body);
	}

	async listWithdrawals(merchant: SimpayMerchantScope, page: number, pageSize: number): Promise<{ items: SimpayWithdrawal[]; meta: { page: number; pageSize: number; totalItems: number; totalPages: number } }> {
		return this.internalJson(`${merchantBase(merchant)}/finance/withdrawals?page=${page}&pageSize=${pageSize}`);
	}

	async getWithdrawal(merchant: SimpayMerchantScope, withdrawalId: string): Promise<SimpayWithdrawal> {
		return this.internalJson(`${merchantBase(merchant)}/finance/withdrawals/${encodeURIComponent(withdrawalId)}`);
	}

	async reconcilePayments(merchant: SimpayMerchantScope, paymentIds: string[], dryRun: boolean): Promise<SimpayReconciliationResult> {
		return this.internalJson(`${merchantBase(merchant)}/finance/reconciliation/payments`, { dryRun, paymentIds });
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

	/** SimIntPay checks DOM and settles its local transaction before reporting approval. */
	async getPixStatusDirect(paymentId: string, merchant?: SimpayMerchantScope): Promise<{ status: string }> {
		if (merchant) return this.getPaymentStatus(paymentId, merchant);
		const response = await fetch(`${resolveBaseUrl()}/zero-grau/payments/pix-status/${encodeURIComponent(paymentId)}`, {
			cache: "no-store",
			headers,
			signal: AbortSignal.timeout(8_000),
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
