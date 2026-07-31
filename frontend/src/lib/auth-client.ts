import { inferAdditionalFields, magicLinkClient, phoneNumberClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";
import { branding } from "@/lib/branding";

export const authClient = createAuthClient({
	basePath: "/auth",
	baseURL: branding.apiUrl,
	// Mirror the server's user.additionalFields (see backend betterAuth.ts) so the
	// client user type carries tenant + RBAC fields instead of being stripped (docs/03).
	plugins: [
		inferAdditionalFields({
			user: {
				companyId: { required: false, type: "string" },
				role: { required: false, type: "string" },
				themePreference: { required: false, type: "string" },
			},
		}),
		phoneNumberClient(),
		magicLinkClient(),
	],
});

export type AuthSession = ReturnType<typeof authClient.useSession>;
