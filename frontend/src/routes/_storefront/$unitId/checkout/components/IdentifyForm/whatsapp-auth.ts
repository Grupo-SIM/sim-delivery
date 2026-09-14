export function toBrazilianE164(phone: string): string | null {
	const digits = phone.replace(/\D/g, "");
	if (phone.trim().startsWith("+") && !digits.startsWith("55")) return null;
	const normalized = digits.length === 11 ? `55${digits}` : digits;
	return /^55\d{11}$/.test(normalized) ? `+${normalized}` : null;
}

export function isValidOtp(code: string): boolean {
	return /^\d{6}$/.test(code.replace(/\D/g, ""));
}
