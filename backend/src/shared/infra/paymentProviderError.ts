const MESSAGE_KEYS = ["msg", "message", "status_details", "internal_msg", "error", "errors"] as const;

export function extractPaymentProviderMessage(value: unknown): string | undefined {
	if (typeof value === "string") return value.trim() || undefined;
	if (Array.isArray(value)) {
		const messages = value.map(extractPaymentProviderMessage).filter((part): part is string => Boolean(part));
		return messages.length > 0 ? messages.join(" ") : undefined;
	}
	if (!value || typeof value !== "object") return undefined;

	const record = value as Record<string, unknown>;
	for (const key of MESSAGE_KEYS) {
		const message = extractPaymentProviderMessage(record[key]);
		if (message) return message;
	}
	return extractPaymentProviderMessage(record.data);
}

export class PaymentProviderError extends Error {
	constructor(
		readonly provider: "DOM" | "Simpay",
		message: string,
		readonly status?: number,
	) {
		super(message);
	}
}

export function paymentProviderErrorDescription(error: unknown): string | undefined {
	return error instanceof PaymentProviderError ? error.message : undefined;
}
