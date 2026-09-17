import { isValidCpf } from "@/lib/cpf";
import { getBrazilianMobileDigits, toBrazilianMobilePhone } from "@/lib/brazilian-phone";

export function hasCompletePaymentIdentity(name: string, cpf: string | null, phone: string | null) {
	const hasFullName = name.trim().split(/\s+/).filter(Boolean).length >= 2;
	const hasCpf = isValidCpf(cpf);
	const hasPhone = getBrazilianMobileDigits(phone).length === 11;
	return hasFullName && hasCpf && hasPhone;
}

export { getBrazilianMobileDigits, toBrazilianMobilePhone };
