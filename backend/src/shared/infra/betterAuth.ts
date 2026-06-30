import { render } from "@react-email/components";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { ResetPasswordEmail } from "@/modules/users/emails";
import { mailer } from "./mail";
import { prisma } from "./sql";

const algorithm = "argon2id";

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
	trustedOrigins: process.env.CORS_WHITELIST!.split(","),
});
