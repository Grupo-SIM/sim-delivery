export function isValidCpf(value: string | null | undefined): boolean {
	const digits = value?.replace(/\D/g, "") ?? "";
	if (digits.length !== 11 || /^(\d)\1{10}$/.test(digits)) return false;

	const firstDigit = calculateCheckDigit(digits.slice(0, 9), 10);
	const secondDigit = calculateCheckDigit(digits.slice(0, 9) + firstDigit, 11);
	return digits === digits.slice(0, 9) + firstDigit + secondDigit;
}

export function isValidDocument(value: string | null | undefined): boolean {
	const digits = value?.replace(/\D/g, "") ?? "";
	if (digits.length === 11) return isValidCpf(digits);
	return digits.length === 14;
}

function calculateCheckDigit(digits: string, multiplier: number): string {
	const sum = [...digits].reduce((total, digit, index) => total + Number(digit) * (multiplier - index), 0);
	const remainder = (sum * 10) % 11;
	return String(remainder === 10 ? 0 : remainder);
}
