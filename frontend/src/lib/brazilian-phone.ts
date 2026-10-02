export function getBrazilianMobileDigits(phone: string | null | undefined): string {
	const digits = phone?.replace(/\D/g, "") ?? "";
	return digits.length === 13 && digits.startsWith("55") ? digits.slice(2) : digits;
}

export function toBrazilianMobilePhone(phone: string | null | undefined): string {
	return `55${getBrazilianMobileDigits(phone)}`;
}

/** Prefer the customer contact, falling back to the phone linked by authentication. */
export function resolveCustomerPhone(customerPhone: string | null | undefined, accountPhone: string | null | undefined): string | null {
	return customerPhone?.trim() || accountPhone?.trim() || null;
}
