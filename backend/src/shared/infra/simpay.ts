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

function resolveBaseUrl(): string {
	const raw = process.env.SIMPAY_API_URL?.trim();
	const fallback = "https://simpay-back.simintermediacoes.com";
	if (!raw) return fallback;
	return raw.replace(/\/+$/, "");
}

function formatErrorMessage(data: unknown): string | undefined {
	if (!data || typeof data !== "object") return undefined;
	const message = (data as { message?: unknown }).message;
	if (typeof message === "string") return message;
	if (Array.isArray(message) && message.every(part => typeof part === "string")) return message.join(" ");
	return undefined;
}

const headers = { Accept: "application/json", "Content-Type": "application/json" };

export class SimpayClient {
	async createCardPayment(params: SimpayCardPaymentParams): Promise<SimpayPaymentResponse> {
		const response = await fetch(`${resolveBaseUrl()}/zero-grau/payments/credit-card`, {
			body: JSON.stringify(params),
			headers,
			method: "POST",
		});
		const data = await response.json();

		if (!response.ok) {
			throw new Error(
				formatErrorMessage(data) || `Erro ao processar pagamento via Simpay (HTTP ${response.status})`,
			);
		}

		return data as SimpayPaymentResponse;
	}

	async createPixPayment(params: SimpayPixPaymentParams): Promise<SimpayPixCreateResponse> {
		const response = await fetch(`${resolveBaseUrl()}/zero-grau/payments/pix`, {
			body: JSON.stringify(params),
			headers,
			method: "POST",
		});

		let data: unknown;
		try {
			data = await response.json();
		} catch {
			throw new Error(`Resposta PIX inválida (HTTP ${response.status}). Confira SIMPAY_API_URL.`);
		}

		if (!response.ok) {
			throw new Error(formatErrorMessage(data) || `Erro ao gerar PIX via Simpay (HTTP ${response.status})`);
		}

		return data as SimpayPixCreateResponse;
	}

	async getPaymentStatus(paymentId: string): Promise<{ paymentId: string; status: string }> {
		const response = await fetch(`${resolveBaseUrl()}/zero-grau/payments/status/${paymentId}`, { headers });
		const data = await response.json();

		if (!response.ok) {
			throw new Error(`Erro ao consultar status do pagamento (HTTP ${response.status})`);
		}

		return data as { paymentId: string; status: string };
	}

	/** Queries DOM directly through back-simpay, without waiting for the webhook. */
	async getPixStatusDirect(paymentId: string): Promise<{ status: string }> {
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
