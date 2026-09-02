import { isValidCpf } from "@/lib/cpf";

export function hasCompletePaymentIdentity(name: string, cpf: string | null) {
	const hasFullName = name.trim().split(/\s+/).filter(Boolean).length >= 2;
	const hasCpf = isValidCpf(cpf);
	return hasFullName && hasCpf;
}
