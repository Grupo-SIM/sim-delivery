import api from "./client-api";

export type SetPasswordError =
	| "CURRENT_PASSWORD_REQUIRED"
	| "INVALID_PASSWORD"
	| "RATE_LIMITED"
	| "UNAUTHORIZED";

export async function setPassword(currentPassword: string | null, newPassword: string) {
	try {
		await api({
			data: { currentPassword, newPassword },
			method: "POST",
			url: "/auth/set-password",
		});
		return { error: null } as const;
	} catch (error) {
		const response = (error as { response?: { data?: { error?: string } } }).response;
		const code = response?.data?.error;
		return {
			error:
				code === "CURRENT_PASSWORD_REQUIRED" ||
				code === "INVALID_PASSWORD" ||
				code === "RATE_LIMITED" ||
				code === "UNAUTHORIZED"
					? code
					: "INVALID_PASSWORD",
		} as const;
	}
}
