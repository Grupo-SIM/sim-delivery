/**
 * SIM INT PAY client. New charges use authenticated company-scoped merchant
 * endpoints with explicit merchant/platform allocation. Historical references
 * require an explicit company binding; no anonymous provider fallback.
 */

import { prisma, type PrismaInstance } from "./sql";
import { encryptSimpaySecret, decryptSimpaySecret } from "./simpay-secrets";
import { extractPaymentProviderMessage, PaymentProviderError } from "./paymentProviderError";

export interface SimpayAllocationItem {
	key: string;
	quantity: number;
	unitPriceCents: number;
}

export interface SimpayPaymentAllocation {
	/** Lets SimIntPay recompute the additive surcharge; it rejects with 409 FEE_MISMATCH on divergence. */
	items?: SimpayAllocationItem[];
	itemsAmountCents?: number;
	deliveryAmountCents?: number;
	merchantAmountCents: number;
	platformFeeCents: number;
}

export interface SimpayCardPaymentParams {
	idempotencyKey: string;
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
	idempotencyKey: string;
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

export interface SimpayFeeLane {
	channel: "ONLINE";
	fixedCents: number;
	installments: number;
	method: "BOLETO" | "CREDIT_CARD" | "DEBIT_CARD" | "PIX";
	ratePpm: number;
}

/** Resolved additive value pushed to SimIntPay: active, associated, overrides already applied. */
export interface SimpayAdditiveValue {
	applicationScope: "order" | "product";
	/** Delivery's platform fee id; opaque to SimIntPay. */
	externalId: string;
	fixedValue: number;
	name: string;
	percentageValue: number;
}

export interface SimpayCompanyFees {
	/** Additive values SimIntPay currently stores for this company's platform. */
	additiveFees?: SimpayAdditiveValue[];
	/** Which fee sets SimIntPay applies to this company's payments. */
	mode: "ADDITIVE_ONLY" | "BOTH" | "SIMINTPAY_ONLY";
	/** Global acquirer cost per lane: what SimIntPay pays regardless of seller. */
	costs: SimpayFeeLane[];
	/** `METHOD/installments` lanes this platform does not accept; excluded from coverage. */
	disabledLanes: string[];
	lanes: SimpayFeeLane[];
	version: string;
}

export interface SimpayFeeDefaults {
	costs: SimpayFeeLane[];
	lanes: SimpayFeeLane[];
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

type CanonicalPayment = { transactionId: string; paymentId: string | null; status: string; amountCents: number; coproductionCents?: number; simintpayFeeCents?: number; qrCode?: string | null; pixContent?: string | null; pixExpire?: string | null };
type RegistrationResult = { id: string; status: "PENDING_OWNER" | "READY"; platform?: { id: string; tag: string }; merchant?: { id: string }; credentials?: { accessToken: string; webhookSecret: string } };
export interface CanonicalCardToken { token: string; bin: string; last4: string; brand: string; expiryMonth: string; expiryYear: string; holderName: string; customerId: string }
function baseUrl() { return (process.env.SIMPAY_API_URL?.trim() || "https://simpay-back.simintermediacoes.com").replace(/\/+$/, ""); }

export class SimpayClient {
	constructor(private readonly db: PrismaInstance) {}
	private async json<T>(path: string, options: { token?: string; provisioning?: boolean; method?: string; body?: unknown } = {}): Promise<T> {
		const token = options.provisioning ? process.env.SIMPAY_PROVISIONING_TOKEN || process.env.SIMPAY_INTERNAL_TOKEN : options.token;
		if (!token) throw new PaymentProviderError("Simpay", "Credencial SIM INT PAY não configurada.", 503);
		const response = await fetch(`${baseUrl()}${path}`, {
			method: options.method ?? "GET", cache: "no-store", signal: AbortSignal.timeout(30000),
			headers: { Accept: "application/json", "Content-Type": "application/json", [options.provisioning ? "x-provisioning-token" : "x-access-token"]: token },
			...(options.body === undefined ? {} : { body: JSON.stringify(options.body) }),
		});
		const data = await response.json().catch(() => null);
		if (!response.ok || !data) {
			const code = data && typeof data === "object" && "code" in data && typeof data.code === "string" ? data.code : undefined;
			const message = extractPaymentProviderMessage(data) || `Erro na API canônica SIM INT PAY (HTTP ${response.status})`;
			throw new PaymentProviderError("Simpay", code ? `${message} (${code})` : message, response.status, code);
		}
		return data as T;
	}
	private async save(companyId: string, result: RegistrationResult) {
		if (!result.id || !["PENDING_OWNER", "READY"].includes(result.status)) throw new PaymentProviderError("Simpay", "Resposta de provisionamento inválida.", 502);
		if (result.status === "READY" && (!result.platform?.id || !result.platform.tag || !result.merchant?.id || !result.credentials?.accessToken || !result.credentials.webhookSecret)) throw new PaymentProviderError("Simpay", "Resposta sem credenciais empresariais.", 502);
		if (result.status === "READY") {
			const pending = await this.db.payment.findMany({ where: { order: { companyId }, status: "pending", simpayPaymentId: { not: null } }, select: { simpayPaymentId: true } });
			const references = [...new Set(pending.map(row => row.simpayPaymentId).filter((id): id is string => !!id))];
			for (let offset = 0; offset < references.length; offset += 500) {
				const audit = await this.json<{ compatible: boolean; conflicts: string[] }>(`/platform-registrations/${encodeURIComponent(companyId)}/compatibility`, { provisioning: true, method: "POST", body: { references: references.slice(offset, offset + 500) } });
				if (!audit.compatible || audit.conflicts.length) throw new PaymentProviderError("Simpay", "Histórico financeiro pendente sem vínculo comprovado; revise associações antes de migrar esta empresa.", 409);
			}
		}
		const data = {
			registrationId: result.platform?.id ?? result.id, status: result.status,
			...(result.status === "READY" ? { platformId: result.platform!.id, platformTag: result.platform!.tag, merchantId: result.merchant!.id,
				encryptedAccessToken: encryptSimpaySecret(result.credentials!.accessToken), encryptedWebhookSecret: encryptSimpaySecret(result.credentials!.webhookSecret) } : {}),
		};
		await this.db.companySimpayIntegration.upsert({ where: { companyId }, create: { companyId, ...data }, update: data });
	}
	async provisionPlatform(scope: SimpayMerchantScope, legalName: string): Promise<{ id: string; status: "PENDING_OWNER" | "READY" }> {
		const result = await this.json<RegistrationResult>(`/platform-registrations/${encodeURIComponent(scope.externalMerchantId)}`, { provisioning: true, method: "PUT", body: { slug: scope.integrationKey.replace(/^sim-delivery_/, ""), legalName } });
		await this.save(scope.externalMerchantId, result);
		return { id: result.id, status: result.status };
	}
	async provisionOwner(scope: SimpayMerchantScope, owner: { cnpj?: string | null; email: string; legalName: string; password?: string }): Promise<{ id: string }> {
		const result = await this.json<RegistrationResult>(`/platform-registrations/${encodeURIComponent(scope.externalMerchantId)}/owner`, { provisioning: true, method: "PUT", body: { ...owner, slug: scope.integrationKey.replace(/^sim-delivery_/, "") } });
		await this.save(scope.externalMerchantId, result);
		return { id: result.merchant!.id };
	}
	/** SimIntPay's own (subtractive) fees for one company, read with the provisioning credential. */
	async companyFees(companyId: string): Promise<SimpayCompanyFees> {
		return this.json(`/platform-registrations/${encodeURIComponent(companyId)}/fees`, { provisioning: true });
	}
	/** Global SimIntPay fees (no company override) and the highest acquirer cost per lane. Admin-only data. */
	async feeDefaults(): Promise<SimpayFeeDefaults> {
		return this.json("/platform-registrations/fees/defaults", { provisioning: true });
	}
	async saveCompanyFees(companyId: string, input: { additiveFees?: SimpayAdditiveValue[]; disabledLanes?: string[]; lanes: SimpayFeeLane[]; mode?: SimpayCompanyFees["mode"]; version: string }): Promise<SimpayCompanyFees> {
		return this.json(`/platform-registrations/${encodeURIComponent(companyId)}/fees`, { body: input, method: "PUT", provisioning: true });
	}
	private async access(scope: SimpayMerchantScope) {
		let integration = await this.db.companySimpayIntegration.findUnique({ where: { companyId: scope.externalMerchantId } });
		if (!integration || integration.status !== "READY") {
			const company = await this.db.company.findUnique({ where: { id: scope.externalMerchantId } });
			if (!company) throw new PaymentProviderError("Simpay", "Empresa não encontrada.", 404);
			await this.provisionPlatform({ externalMerchantId: company.id, integrationKey: simpayIntegrationKey(company.slug) }, company.name);
			integration = await this.db.companySimpayIntegration.findUnique({ where: { companyId: company.id } });
		}
		if (!integration?.platformTag || !integration.encryptedAccessToken || integration.status !== "READY") throw new PaymentProviderError("Simpay", "Cadastre o primeiro dono para concluir integração financeira.", 422);
		return { path: `/platforms/${encodeURIComponent(integration.platformTag)}/merchants/${encodeURIComponent(scope.externalMerchantId)}`, token: decryptSimpaySecret(integration.encryptedAccessToken) };
	}
	private async scoped<T>(scope: SimpayMerchantScope, path: string, body?: unknown, method?: string): Promise<T> {
		const access = await this.access(scope);
		return this.json<T>(access.path + path, { token: access.token, body, method: method ?? (body === undefined ? "GET" : "POST") });
	}
	async provisionMerchant(scope: SimpayMerchantReference): Promise<{ id: string }> { return this.scoped(scope, "", { cnpj: scope.cnpj, legalName: scope.legalName }, "PUT"); }
	async createCustomer(scope: SimpayMerchantScope, input: { externalCustomerId: string; name: string; email: string; document: string; phone?: string }): Promise<{ id: string }> { return this.scoped(scope, "/customers", input); }
	async tokenizeCard(scope: SimpayMerchantScope, customerId: string, input: { number: string; cvv: string; expMonth: number; expYear: number; holderName: string; holderDocument: string }): Promise<CanonicalCardToken> { return this.scoped(scope, `/customers/${encodeURIComponent(customerId)}/card-tokens`, input); }
	private async createPayment(params: SimpayPixPaymentParams | SimpayCardPaymentParams, scope: SimpayMerchantReference | undefined, method: "PIX" | "CREDIT_CARD") {
		if (!scope) throw new PaymentProviderError("Simpay", "Configure o CPF/CNPJ e a carteira da empresa antes de receber pagamentos online.", 422);
		await this.provisionMerchant(scope);
		const card = params as SimpayCardPaymentParams;
		return this.scoped<CanonicalPayment>(scope, "/payments", { amountCents: Math.round(params.price * 100), paymentMethod: method, idempotencyKey: params.idempotencyKey,
			allocation: params.allocation, description: params.description,
			customer: { name: params.name, email: params.email, document: params.document, documentType: params.document_type, phone: params.mobile_phone },
			...(method === "CREDIT_CARD" ? { card: { token: card.token, holderName: card.holder_name, bin: card.bin, brand: card.brand, installments: card.installments } } : {}),
		});
	}
	async createPixPayment(params: SimpayPixPaymentParams, scope?: SimpayMerchantReference): Promise<SimpayPixCreateResponse> {
		const result = await this.createPayment(params, scope, "PIX");
		return { transactionId: result.transactionId, paymentId: result.paymentId ?? result.transactionId, status: result.status, pix_qrcode: result.qrCode ?? null, pix_content: result.pixContent ?? null };
	}
	async createCardPayment(params: SimpayCardPaymentParams, scope?: SimpayMerchantReference): Promise<SimpayPaymentResponse> {
		const result = await this.createPayment(params, scope, "CREDIT_CARD");
		return { transactionId: result.transactionId, paymentId: result.paymentId ?? result.transactionId, status: result.status };
	}
	async getPaymentAttempt(scope: SimpayMerchantScope, key: string): Promise<CanonicalPayment> { return this.scoped(scope, `/payment-attempts/${encodeURIComponent(key)}`); }
	async getPaymentStatus(paymentId: string, scope?: SimpayMerchantScope): Promise<{ coproductionCents: number; paymentId: string; simintpayFeeCents: number; status: string }> {
		if (!scope) throw new PaymentProviderError("Simpay", "Pagamento histórico exige associação empresarial explícita.", 422);
		const result = await this.scoped<CanonicalPayment>(scope, `/payments/${encodeURIComponent(paymentId)}`);
		return { coproductionCents: result.coproductionCents ?? 0, simintpayFeeCents: result.simintpayFeeCents ?? 0, paymentId: result.paymentId ?? result.transactionId, status: result.status };
	}
	async getPixStatusDirect(paymentId: string, scope?: SimpayMerchantScope) { return this.getPaymentStatus(paymentId, scope); }
	async getWithdrawalSummary(scope: SimpayMerchantScope): Promise<SimpayWithdrawalSummary> {
		const result = await this.scoped<Omit<SimpayWithdrawalSummary, "feePolicy"> & { feePolicy: { fixedCents: number; rate: number } }>(scope, "/finance/summary");
		return { ...result, feePolicy: { fixedCents: result.feePolicy.fixedCents, percentBasisPoints: Math.round(result.feePolicy.rate * 10000) } };
	}
	async quoteWithdrawal(scope: SimpayMerchantScope, grossAmountCents: number): Promise<{ feeCents: number; grossAmountCents: number; netAmountCents: number }> { return this.scoped(scope, "/finance/withdrawals/quote", { amountCents: grossAmountCents }); }
	private withdrawal(result: Omit<SimpayWithdrawal, "netAmountCents"> & { amountCents: number }): SimpayWithdrawal { return { ...result, netAmountCents: result.amountCents }; }
	async requestWithdrawal(scope: SimpayMerchantScope, body: { grossAmountCents: number; pixKey: string; requestId: string }): Promise<SimpayWithdrawal> {
		return this.withdrawal(await this.scoped(scope, "/finance/withdrawals", { amountCents: body.grossAmountCents, pixKey: body.pixKey, idempotencyKey: body.requestId }));
	}
	async listWithdrawals(scope: SimpayMerchantScope, page: number, pageSize: number): Promise<{ items: SimpayWithdrawal[]; meta: { page: number; pageSize: number; totalItems: number; totalPages: number } }> {
		const result = await this.scoped<{ data: (Omit<SimpayWithdrawal, "netAmountCents"> & { amountCents: number })[]; meta: { page: number; limit: number; total: number; totalPages: number } }>(scope, `/finance/withdrawals?page=${page}&limit=${pageSize}`);
		return { items: result.data.map(row => this.withdrawal(row)), meta: { page: result.meta.page, pageSize: result.meta.limit, totalItems: result.meta.total, totalPages: result.meta.totalPages } };
	}
	async getWithdrawal(scope: SimpayMerchantScope, id: string): Promise<SimpayWithdrawal> { return this.withdrawal(await this.scoped(scope, `/finance/withdrawals/${encodeURIComponent(id)}`)); }
	async reconcilePayments(scope: SimpayMerchantScope, paymentIds: string[], dryRun: boolean): Promise<SimpayReconciliationResult> { return this.scoped(scope, "/finance/reconciliation/payments", { paymentIds, dryRun }); }
	async refundPayment(_paymentId: string, _amountCents: number): Promise<{ externalId: string }> { throw new Error("REFUND_NOT_SUPPORTED"); }
}
export const simpay = new SimpayClient(prisma);
