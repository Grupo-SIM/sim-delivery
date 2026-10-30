import type { GetPlatformFeesByCompanyByCompanyId200 } from "@/lib/api";

export type CompanyFees = GetPlatformFeesByCompanyByCompanyId200;
export type SimintpayLane = CompanyFees["simintpay"]["lanes"][number];
export type CoverageLane = CompanyFees["coverage"][number];
export type FeeMode = CompanyFees["mode"];

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
