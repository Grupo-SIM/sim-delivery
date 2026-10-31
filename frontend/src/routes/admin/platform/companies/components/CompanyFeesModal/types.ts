import type { GetPlatformFeesByCompanyByCompanyId200 } from "@/lib/api";

export type CompanyFees = GetPlatformFeesByCompanyByCompanyId200;
export type SimintpayLane = CompanyFees["simintpay"]["lanes"][number];
export type CoverageLane = CompanyFees["coverage"][number];
export type FeeMode = CompanyFees["mode"];
/** Catalog fee with this company's association and overrides, straight from SimIntPay. */
export type CompanyAdditiveFee = CompanyFees["additiveFees"][number];

/** Inputs hold decimal strings the user sees: percent ("4,5") and reais ("1"). */
export interface LaneDraft {
	fixed: string;
	rate: string;
}

export function laneId(lane: { installments: number | string; method: string }) {
	return `${lane.method}/${lane.installments}`;
}

export function ppmToPercent(ppm: number | string) {
	return String(Number(ppm) / 10_000);
}

export function percentToPpm(percent: string) {
	return Math.round(Number(percent || 0) * 10_000);
}

export function centsToReais(cents: number | string) {
	return String(Number(cents) / 100);
}

export function reaisToCents(reais: string) {
	return Math.round(Number(reais || 0) * 100);
}

const METHOD_ORDER = ["CREDIT_CARD", "DEBIT_CARD", "PIX", "BOLETO"];

/** Payment method first, then installments numerically (10x after 2x). */
export function compareLanes(a: { installments: number | string; method: string }, b: { installments: number | string; method: string }) {
	const method = METHOD_ORDER.indexOf(a.method) - METHOD_ORDER.indexOf(b.method);
	return method || Number(a.installments) - Number(b.installments);
}

/** Pending company-specific edit of an additive fee; only sent when the whole modal is saved. */
export interface ExtraFeeDraft {
	active: boolean;
	/** Reais, empty = platform default. */
	fixed: string;
	/** Percent, empty = platform default. */
	percentage: string;
	/** Drop the company exception entirely. */
	reset: boolean;
}

export const percentToBasisPoints = (percent: string) => (percent === "" ? null : Math.round(Number(percent) * 100));
export const reaisToNullableCents = (reais: string) => (reais === "" ? null : Math.round(Number(reais) * 100));
