import "@/env";
import { render } from "@react-email/components";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { magicLink, phoneNumber } from "better-auth/plugins";
import { MagicLinkEmail, ResetPasswordEmail } from "@/modules/users/emails";
import { mailer } from "./mail";
import { type PhoneOtpProviderKey, phoneOtpProviders } from "./phoneOtp";
import { resolveSiteSessionOverride } from "./resolveSiteSessionOverride";
import { prisma } from "./sql";

const algorithm = "argon2id";

const phoneOtpProvider = new phoneOtpProviders[process.env.PHONE_OTP_DRIVER as PhoneOtpProviderKey]();

export const auth = betterAuth({
	basePath: "/auth",
	database: prismaAdapter(prisma, {
		provider: "postgresql",
	}),
	// Site-scoped login (docs/02, docs/03): each whitelabel frontend build sends its own
	// `slug` (VITE_COMPANY_SLUG, same one used by the public storefront to resolve
	// its company) as a `?slug=` query param on sign-in. A superAdmin session gets
	// scoped to that site's companyId without touching their (company-agnostic) user row;
	// a staff member signing into a site that isn't their own is downgraded to "customer"
	// for that session only, so their staff powers don't leak across tenants.
	databaseHooks: {
		session: {
			create: {
				before: async (session, context) => {
					const slug = context?.query?.slug as string | undefined;
					if (!slug) {
						return;
					}

					const [user, company] = await Promise.all([
						prisma.user.findUnique({
							select: { companyId: true, role: true },
							where: { id: session.userId },
						}),
						prisma.company.findUnique({ select: { id: true }, where: { slug } }),
					]);
					if (!user || !company) {
						return;
					}

					const override = resolveSiteSessionOverride(company.id, user);
					return override ? { data: override } : undefined;
				},
			},
		},
	},
	emailAndPassword: {
		enabled: true,
		minPasswordLength: 6,
		resetPasswordTokenExpiresIn: 60 * 60 * 24 * 7,
		password: {
			hash: password => Bun.password.hash(password, { algorithm }),
			verify: ({ hash, password }) => Bun.password.verify(password, hash, algorithm),
		},
		sendResetPassword: async ({ url, user }) => {
			await mailer.sendMail({
				from: `"Template App" <${process.env.MAIL_USER}>`,
				html: await render(ResetPasswordEmail({ name: user.name, url })),
			subject: "Defina sua senha",
			text: `Olá, ${user.name}! Acesse o link para definir sua senha: ${url}. O link expira em 7 dias e pode ser usado uma única vez.`,
				to: user.email,
			});
		},
	},
	plugins: [
		phoneNumber({
			sendOTP: async ({ code, phoneNumber: to }) => {
				await phoneOtpProvider.sendCode(to, code);
			},
			signUpOnVerification: {
				getTempEmail: to => `${to}@phone.local`,
				getTempName: to => to,
			},
		}),
		magicLink({
			sendMagicLink: async ({ email, metadata, token }) => {
				const unitId = typeof metadata?.unitId === "string" ? metadata.unitId : undefined;
				const url = `${process.env.APP_URL}/identify/magic-link?token=${token}${unitId ? `&unitId=${unitId}` : ""}`;
				await mailer.sendMail({
					from: `"Template App" <${process.env.MAIL_USER}>`,
					html: await render(MagicLinkEmail({ url })),
					subject: "Seu link de acesso",
					text: `Acesse sua conta: ${url}. O link expira em 5 minutos.`,
					to: email,
				});
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
			? process.env.CORS_WHITELIST!.split(",")
			: [
					...process.env.CORS_WHITELIST!.split(","),
					"http://localhost:3000",
					"http://localhost:3333",
					"http://localhost:5173",
				],
	// Tenant + RBAC fields (docs/03). Surfaced on session.user so guards can scope by
	// company/role without an extra query. `role` defaults to customer for self sign-ups.
	user: {
		additionalFields: {
			companyId: { input: false, required: false, type: "string" },
			role: { defaultValue: "customer", input: false, required: false, type: "string" },
		},
	},
});
