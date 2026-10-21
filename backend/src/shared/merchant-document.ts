import { isValidCpf } from "./cpf";

export function isValidMerchantDocument(value: string): boolean {
	if (/^\d{11}$/.test(value)) return isValidCpf(value);
	if (!/^\d{14}$/.test(value) || /^(\d)\1{13}$/.test(value)) return false;
	const digit = (base: string) => {
		let weight = base.length - 7;
		const sum = [...base].reduce((total, char) => {
			const next = total + Number(char) * weight;
			weight = weight === 2 ? 9 : weight - 1;
			return next;
		}, 0);
		return sum % 11 < 2 ? 0 : 11 - sum % 11;
	};
	return digit(value.slice(0, 12)) === Number(value[12]) && digit(value.slice(0, 13)) === Number(value[13]);
}
