import { branding } from "./branding";

interface RequestMagicLinkInput {
	email: string;
	metadata?: Record<string, unknown>;
}

export class RequestMagicLinkError extends Error {
	constructor(readonly code: string) {
		super(code);
	}
}

/** Requests a passwordless link; verification signs in or creates the customer account. */
export async function requestMagicLink(input: RequestMagicLinkInput): Promise<void> {
	const response = await fetch(`${branding.apiUrl}/auth/request-magic-link`, {
		body: JSON.stringify(input),
		credentials: "include",
		headers: { "Content-Type": "application/json" },
		method: "POST",
	});

	if (response.ok) return;

	const data: unknown = await response.json().catch(() => null);
	const code =
		typeof data === "object" && data !== null && "error" in data && typeof data.error === "string"
			? data.error
			: "REQUEST_FAILED";
	throw new RequestMagicLinkError(code);
}
