import "@/env";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { magicLink, phoneNumber } from "better-auth/plugins";
import { MagicLinkEmail, ResetPasswordEmail } from "./emails";
import { TAURI_ORIGINS } from "./elysia/cors";
import { type PhoneOtpProviderKey, phoneOtpProviders } from "./phoneOtp";
import { prisma } from "./sql";
import { normalizeBrazilianWhatsAppPhone } from "./whatsapp";

const algorithm = "argon2id";
const accessVerificationExpiresIn = 30 * 60;

const phoneOtpProvider = new phoneOtpProviders[process.env.PHONE_OTP_DRIVER as PhoneOtpProviderKey]();

export const auth = betterAuth({
	// Tauri webviews (tauri.localhost) call the API cross-site; default SameSite=Lax cookies would never be
	// stored or sent, so sign-in appears to succeed but the session read comes back empty.
	advanced: {
		defaultCookieAttributes:
			process.env.NODE_ENV === "production" ? { sameSite: "none", secure: true } : undefined,
	},
	basePath: "/auth",
    databaseHooks: { user: { create: { after: async user => {
        await prisma.user.update({ where: { id: user.id }, data: { registrationEventPendingAt: new Date() } });
    } } } },
	database: prismaAdapter(prisma, {
		provider: "postgresql",
	}),

	emailAndPassword: {
		enabled: true,
		minPasswordLength: 6,
		password: {
			hash: password => Bun.password.hash(password, { algorithm }),
			verify: ({ hash, password }) => Bun.password.verify(password, hash, algorithm),
		},
		resetPasswordTokenExpiresIn: 60 * 60 * 24 * 7,
		sendResetPassword: async ({ url, user }) => {
			await new ResetPasswordEmail({ name: user.name, to: user.email, url }).send();
		},
	},
	plugins: [
		phoneNumber({
			allowedAttempts: 3,
			expiresIn: accessVerificationExpiresIn,
			otpLength: 6,
			phoneNumberValidator: to => {
				try {
					normalizeBrazilianWhatsAppPhone(to);
					return true;
				} catch {
					return false;
				}
			},
			sendOTP: async ({ code, phoneNumber: to }) => {
				await phoneOtpProvider.sendCode(to, code);
			},
			signUpOnVerification: {
				getTempEmail: to => `${to}@phone.local`,
				getTempName: to => to,
			},
		}),
		magicLink({
			expiresIn: accessVerificationExpiresIn,
			sendMagicLink: async ({ email, metadata, token }) => {
				const unitId = typeof metadata?.unitId === "string" ? metadata.unitId : undefined;
				const redirectTo = typeof metadata?.redirectTo === "string" && metadata.redirectTo.startsWith("/") && !metadata.redirectTo.startsWith("//") && !metadata.redirectTo.startsWith("/identify")
					? metadata.redirectTo
					: undefined;
				const url = new URL("/identify/magic-link", process.env.APP_URL);
				url.searchParams.set("token", token);
				if (unitId) url.searchParams.set("unitId", unitId);
				if (redirectTo) url.searchParams.set("redirectTo", redirectTo);
				await new MagicLinkEmail({ to: email, url: url.toString() }).send();
			},
		}),
	],
	// Per-session tenant/role override (see databaseHooks.session.create.before above).
	// Only ever set programmatically by that hook, never accepted as client input.
	session: {
		additionalFields: {
			companyId: { input: false, required: false, type: "string" },
			role: { input: false, required: false, type: "string" },
		},
		// Short-lived signed cookie cache so repeated getSession() calls (every route's
		// beforeLoad, useSession) don't hit the DB each time and blow the /auth rate limit.
		cookieCache: {
			enabled: true,
			maxAge: 60,
		},
	},
	// Same dev/prod split as the Elysia CORS plugin above: extend the whitelist
	// with common localhost ports so the Vite dev server isn't blocked by
	// CORS_WHITELIST pointing at the production URL.
	trustedOrigins:
		process.env.NODE_ENV === "production"
			? [...process.env.CORS_WHITELIST!.split(","), ...TAURI_ORIGINS]
			: [
					...process.env.CORS_WHITELIST!.split(","),
					...TAURI_ORIGINS,
					"http://localhost:3000",
					"http://localhost:3333",
					"http://localhost:5173",
				],
	// Tenant + RBAC fields (docs/03). Surfaced on session.user so guards can scope by
	// company/role without an extra query. `role` defaults to customer for self sign-ups.
	user: {
		changeEmail: {
			enabled: true,
			updateEmailWithoutVerification: true,
		},
		additionalFields: {
			companyId: { input: false, required: false, type: "string" },
			role: { defaultValue: "customer", input: false, required: false, type: "string" },
			themePreference: { input: true, required: false, type: "string" },
		},
	},
});
