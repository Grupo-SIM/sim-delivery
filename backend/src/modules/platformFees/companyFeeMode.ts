import { PaymentProviderError } from "@/shared/infra/paymentProviderError";
import { simpay, type SimpayClient, type SimpayCompanyFees } from "@/shared/infra/simpay";

export type PlatformFeeMode = SimpayCompanyFees["mode"];

type ModeSource = Pick<SimpayClient, "companyFees">;

const TTL_MS = 60_000;
const cache = new Map<string, { expiresAt: number; fees: Pick<SimpayCompanyFees, "additiveFees" | "mode"> }>();
let source: ModeSource = simpay;

/** Tests inject a source so they never reach SimIntPay. */
export function setFeeModeSource(next: ModeSource | null) {
	source = next ?? simpay;
	cache.clear();
}

/** Drops the cached fees after they were changed, so the next order sees them immediately. */
export function invalidateCompanyFeeMode(companyId: string) {
	cache.delete(companyId);
}

export function rememberCompanyFeeMode(companyId: string, fees: Pick<SimpayCompanyFees, "additiveFees" | "mode">) {
	cache.set(companyId, { expiresAt: Date.now() + TTL_MS, fees: { additiveFees: fees.additiveFees, mode: fees.mode } });
}

/**
 * The fee mode and the additive fees are dictated by SimIntPay; Delivery only consumes them. A company SimIntPay
 * does not know yet (404) has no online payments to price, so it has no additive fees. Any other failure is thrown:
 * guessing would misprice orders.
 */
export async function getCompanyFeeSettings(
	companyId: string,
): Promise<{ additiveFees: NonNullable<SimpayCompanyFees["additiveFees"]>; mode: PlatformFeeMode }> {
	const cached = cache.get(companyId);
	if (cached && cached.expiresAt > Date.now()) return { additiveFees: cached.fees.additiveFees ?? [], mode: cached.fees.mode };
	try {
		const fees = await source.companyFees(companyId);
		rememberCompanyFeeMode(companyId, fees);
		return { additiveFees: fees.additiveFees ?? [], mode: fees.mode };
	} catch (error) {
		if (error instanceof PaymentProviderError && error.status === 404) return { additiveFees: [], mode: "ADDITIVE_ONLY" };
		throw error;
	}
}

export async function getCompanyFeeMode(companyId: string): Promise<PlatformFeeMode> {
	return (await getCompanyFeeSettings(companyId)).mode;
}
