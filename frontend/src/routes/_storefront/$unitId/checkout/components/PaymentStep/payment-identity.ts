export function hasCompletePaymentIdentity(name: string, cpf: string | null) {
	const hasFullName = name.trim().split(/\s+/).filter(Boolean).length >= 2;
	const hasCpf = (cpf?.replace(/\D/g, "").length ?? 0) === 11;
	return hasFullName && hasCpf;
}
