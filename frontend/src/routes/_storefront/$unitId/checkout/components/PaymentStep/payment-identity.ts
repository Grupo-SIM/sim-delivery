import { isValidCpf } from "@/lib/cpf";

export function hasCompletePaymentIdentity(name: string, cpf: string | null, phone: string | null) {
	const hasFullName = name.trim().split(/\s+/).filter(Boolean).length >= 2;
	const hasCpf = isValidCpf(cpf);
	const hasPhone = phone?.replace(/\D/g, "").length === 13;
	return hasFullName && hasCpf && hasPhone;
}
