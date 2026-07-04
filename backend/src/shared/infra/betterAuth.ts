import "@/env";
import { render } from "@react-email/components";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { magicLink, phoneNumber } from "better-auth/plugins";
import { MagicLinkEmail, ResetPasswordEmail } from "@/modules/users/emails";
import { mailer } from "./mail";
import { type PhoneOtpProviderKey, phoneOtpProviders } from "./phoneOtp";
import { prisma } from "./sql";

const algorithm = "argon2id";

const phoneOtpProvider = new phoneOtpProviders[process.env.PHONE_OTP_DRIVER as PhoneOtpProviderKey]();

export const auth = betterAuth({
	basePath: "/auth",
	database: prismaAdapter(prisma, {
		provider: "postgresql",
	}),
	emailAndPassword: {
		enabled: true,
		minPasswordLength: 0,
		password: {
			hash: password => Bun.password.hash(password, { algorithm }),
			verify: ({ hash, password }) => Bun.password.verify(password, hash, algorithm),
		},
		sendResetPassword: async ({ url, user }) => {
			await mailer.sendMail({
				from: `"Template App" <${process.env.MAIL_USER}>`,
				html: await render(ResetPasswordEmail({ name: user.name, url })),
				subject: "Redefinição de senha",
				text: `Olá, ${user.name}! Acesse o link para redefinir sua senha: ${url}. O link expira em 1 hora.`,
				to: user.email,
			});
		},
	},
	experimental: {
		joins: true,
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
			sendMagicLink: async ({ email, token }) => {
				const url = `${process.env.APP_URL}/identify/magic-link?token=${token}`;
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
	trustedOrigins: process.env.CORS_WHITELIST!.split(","),
	// Tenant + RBAC fields (docs/03). Surfaced on session.user so guards can scope by
	// company/role without an extra query. `role` defaults to customer for self sign-ups.
	user: {
		additionalFields: {
			companyId: { input: false, required: false, type: "string" },
			level: { input: false, required: false, type: "string" },
			role: { defaultValue: "customer", input: false, required: false, type: "string" },
		},
	},
});
