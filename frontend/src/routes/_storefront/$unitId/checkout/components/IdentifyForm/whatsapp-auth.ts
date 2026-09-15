export type IdentifierKind = "email" | "phone";

export function toBrazilianE164(phone: string): string | null {
	const digits = phone.replace(/\D/g, "");
	if (phone.trim().startsWith("+") && !digits.startsWith("55")) return null;
	const normalized = digits.length === 11 ? `55${digits}` : digits;
	return /^55\d{11}$/.test(normalized) ? `+${normalized}` : null;
}

export function isValidEmail(email: string): boolean {
	return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export function getIdentifierKind(identifier: string, enableWhatsApp: boolean): IdentifierKind | null {
	if (isValidEmail(identifier)) return "email";
	if (enableWhatsApp && toBrazilianE164(identifier)) return "phone";
	return null;
}

export function formatBrazilianWhatsAppInput(value: string): string {
	if (/[a-z@]/i.test(value)) return value.replace(/[()\s]/g, "");

	const digits = value.replace(/\D/g, "");
	if (!digits) return value;

	const hasCountryCode = value.trim().startsWith("+") || digits.length > 11;
	const local = hasCountryCode ? digits.slice(2, 13) : digits.slice(0, 11);
	const countryCode = hasCountryCode ? "+55 " : "";
	if (local.length <= 2) return `${countryCode}${local ? `(${local}` : ""}`;
	if (local.length <= 7) return `${countryCode}(${local.slice(0, 2)}) ${local.slice(2)}`;
	return `${countryCode}(${local.slice(0, 2)}) ${local.slice(2, 7)}-${local.slice(7)}`;
}

export function isValidOtp(code: string): boolean {
	return /^\d{6}$/.test(code.replace(/\D/g, ""));
}
