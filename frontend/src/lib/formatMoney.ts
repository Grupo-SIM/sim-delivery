const formatters = new Map<string, Intl.NumberFormat>();

function getFormatter(locale: string, currency: string): Intl.NumberFormat {
	const key = `${locale}:${currency}`;
	let formatter = formatters.get(key);
	if (!formatter) {
		formatter = new Intl.NumberFormat(locale, {
			currency,
			maximumFractionDigits: 2,
			minimumFractionDigits: 2,
			style: "currency",
		});
		formatters.set(key, formatter);
	}
	return formatter;
}

export function formatMoney(amount: number, locale = "pt-BR", currency = "BRL"): string {
	return getFormatter(locale, currency).format(amount);
}

export function formatOdd(odd: number): string {
	return odd.toFixed(2);
}

export function formatPercent(value: number, locale = "pt-BR"): string {
	return new Intl.NumberFormat(locale, {
		maximumFractionDigits: 1,
		minimumFractionDigits: 0,
		style: "percent",
	}).format(value);
}
