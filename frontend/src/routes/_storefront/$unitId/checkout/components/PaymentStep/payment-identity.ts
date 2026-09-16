import { isValidCpf } from "@/lib/cpf";

export function hasCompletePaymentIdentity(name: string, cpf: string | null, phone: string | null) {
	const hasFullName = name.trim().split(/\s+/).filter(Boolean).length >= 2;
	const hasCpf = isValidCpf(cpf);
	const hasPhone = getBrazilianMobileDigits(phone).length === 11;
	return hasFullName && hasCpf && hasPhone;
}

export function getBrazilianMobileDigits(phone: string | null): string {
	const digits = phone?.replace(/\D/g, "") ?? "";
	return digits.length === 13 && digits.startsWith("55") ? digits.slice(2) : digits;
}

export function toBrazilianMobilePhone(phone: string | null): string {
	return `55${getBrazilianMobileDigits(phone)}`;
}
