import { PaymentProviderError } from "@/shared/infra/paymentProviderError";
import { simpay, type SimpayClient, type SimpayCompanyFees } from "@/shared/infra/simpay";
import type { PlatformFeeMode } from "./feeCoverage";

type ModeSource = Pick<SimpayClient, "companyFees">;

const TTL_MS = 60_000;
const cache = new Map<string, { expiresAt: number; fees: Pick<SimpayCompanyFees, "additiveFees" | "mode"> }>();
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

export function rememberCompanyFeeMode(companyId: string, fees: Pick<SimpayCompanyFees, "additiveFees" | "mode">) {
	cache.set(companyId, { expiresAt: Date.now() + TTL_MS, fees: { additiveFees: fees.additiveFees, mode: fees.mode } });
}

/**
 * SimIntPay's mode and additive totals for a company, briefly cached. A company SimIntPay does not know yet (404)
 * has no online payments to price: null, which keeps the historical additive-only behavior. Any other failure is
 * thrown: guessing would misprice orders.
 */
export async function getCompanyFeeSnapshot(companyId: string): Promise<Pick<SimpayCompanyFees, "additiveFees" | "mode"> | null> {
	const cached = cache.get(companyId);
	if (cached && cached.expiresAt > Date.now()) return cached.fees;
	try {
		const fees = await source.companyFees(companyId);
		rememberCompanyFeeMode(companyId, fees);
		return fees;
	} catch (error) {
		if (error instanceof PaymentProviderError && error.status === 404) return null;
		throw error;
	}
}

export async function getCompanyFeeMode(companyId: string): Promise<PlatformFeeMode> {
	return (await getCompanyFeeSnapshot(companyId))?.mode ?? "ADDITIVE_ONLY";
}
