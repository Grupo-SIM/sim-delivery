export type CnpjSource = "COMPANY" | "UNIT";

export const cnpjSources = ["UNIT", "COMPANY"] as const satisfies readonly CnpjSource[];

/**
 * Picks the document to use for orders or withdrawals. `UNIT` prefers the unit document and falls back to the
 * company's; `COMPANY` prefers the company's and falls back to the unit's. Returns null when neither exists.
 */
export function resolveCnpj(source: string, unitCnpj: string | null | undefined, companyCnpj: string | null | undefined): string | null {
	const unit = unitCnpj?.trim() || null;
	const company = companyCnpj?.trim() || null;
	return source === "COMPANY" ? company ?? unit : unit ?? company;
}
