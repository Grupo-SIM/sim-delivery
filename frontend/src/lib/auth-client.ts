import { inferAdditionalFields } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

const baseURL = import.meta.env.VITE_API_URL ?? "http://localhost:3333";

export const authClient = createAuthClient({
	basePath: "/auth",
	baseURL,
	// Mirror the server's user.additionalFields (see backend betterAuth.ts) so the
	// client user type carries role/document/kycStatus instead of being stripped.
	plugins: [
		inferAdditionalFields({
			user: {
				document: { required: false, type: "string" },
				kycStatus: { required: false, type: "string" },
				role: { required: false, type: "string" },
			},
		}),
	],
});

export type AuthSession = ReturnType<typeof authClient.useSession>;
