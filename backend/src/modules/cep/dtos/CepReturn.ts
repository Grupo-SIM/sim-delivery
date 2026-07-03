import { t } from "elysia";

/** Normalized address resolved from a Brazilian postal code (CEP). Mirrors the address
 * fields the storefront form auto-fills; the street `number` is never part of a CEP. */
export const CepReturn = t.Object({
	addressLine: t.String(),
	city: t.String(),
	complement: t.String(),
	neighborhood: t.String(),
	state: t.String(),
	zipCode: t.String(),
});
export type CepReturn = typeof CepReturn.static;
