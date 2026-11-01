import { PaymentProviderError } from "@/shared/infra/paymentProviderError";
import { simpay, type SimpayClient, type SimpayCompanyFees } from "@/shared/infra/simpay";
import type { PlatformFeeMode } from "./feeCoverage";

type ModeSource = Pick<SimpayClient, "companyFees">;

const TTL_MS = 60_000;
const cache = new Map<string, { expiresAt: number; mode: PlatformFeeMode }>();
let source: ModeSource = simpay;

/** Tests inject a source so they never reach SimIntPay. */
export function setFeeModeSource(next: ModeSource | null) {
	source = next ?? simpay;
	cache.clear();
}

/** Drops the cached mode after it was changed, so the next order sees it immediately. */
export function invalidateCompanyFeeMode(companyId: string) {
	cache.delete(companyId);
}

export function rememberCompanyFeeMode(companyId: string, fees: Pick<SimpayCompanyFees, "mode">) {
	cache.set(companyId, { expiresAt: Date.now() + TTL_MS, mode: fees.mode });
}

/**
 * The fee mode is dictated by SimIntPay; Delivery only consumes it. A company SimIntPay does not know yet (404)
 * has no online payments to price, so it keeps the historical additive-only behavior. Any other failure is thrown:
 * guessing a mode would misprice orders.
 */
export async function getCompanyFeeMode(companyId: string): Promise<PlatformFeeMode> {
	const cached = cache.get(companyId);
	if (cached && cached.expiresAt > Date.now()) return cached.mode;
	try {
		const fees = await source.companyFees(companyId);
		rememberCompanyFeeMode(companyId, fees);
		return fees.mode;
	} catch (error) {
		if (error instanceof PaymentProviderError && error.status === 404) return "ADDITIVE_ONLY";
		throw error;
	}
}
