import cors from "@elysiajs/cors";
import staticPlugin from "@elysiajs/static";
import { timeConversion } from "@hyoretsu/utils";
import Elysia, { t } from "elysia";
import { RequestMagicLink } from "@/modules/users/useCases/RequestMagicLink";
import { envSchema } from "@/env";
import { DomainError } from "@/shared/errors/DomainError";
import { auth } from "@/shared/infra/betterAuth";
import { prisma } from "@/shared/infra/sql";
import { GlobalPlugin } from "./global";
import { OpenAPI } from "./openapi";
import { consume } from "./rateLimit";

export const app = new Elysia({ normalize: "typebox" })
	.env(envSchema)
	.onError(({ error, set }) => {
		if (error instanceof DomainError) {
			set.status = error.status;

			return {
				...(error.description && { description: error.description }),
				error: error.message,
			};
		}
	})
	.use([
		cors({
			credentials: true,
			// In non-production, allow all origins so the local Vite dev server
			// (localhost:5173) can reach a locally-running backend without requiring
			// CORS_WHITELIST to be updated for every developer's setup.
			origin:
				process.env.NODE_ENV === "production" ? process.env.CORS_WHITELIST?.split(",").filter(Boolean) : true,
		}),
		staticPlugin({
			assets: process.env.STATIC_DIR!,
			prefix: "/static",
		}),
		GlobalPlugin,
	])
	.post(
		"/auth/request-magic-link",
		async ({ body, request }) => {
			const requestMagicLink = new RequestMagicLink(prisma.user, async input => {
				await auth.api.signInMagicLink({ body: input, headers: request.headers });
			});

			await requestMagicLink.execute(body);
			return { status: true };
		},
		{
			body: t.Object({
				email: t.String({ format: "email", maxLength: 320 }),
				metadata: t.Optional(t.Record(t.String(), t.Unknown())),
			}),
			response: t.Object({ status: t.Boolean() }),
		},
	)
	.post("/auth/set-password", async ({ request, set }) => {
		const body = await request.json().catch(() => null);
		if (
			typeof body !== "object" ||
			body === null ||
			!("newPassword" in body) ||
			typeof body.newPassword !== "string" ||
			!("currentPassword" in body) ||
			(body.currentPassword !== null && typeof body.currentPassword !== "string")
		) {
			set.status = 400;
			return { error: "INVALID_PASSWORD" };
		}

		const session = await auth.api.getSession({ headers: request.headers });
		if (!session?.user) {
			set.status = 401;
			return { error: "UNAUTHORIZED" };
		}
		const accounts = await prisma.account.findMany({
			select: { password: true },
			where: { providerId: "credential", userId: session.user.id },
		});
		const hasPassword = accounts.some(account => !!account.password);
		if (hasPassword) {
			if (!body.currentPassword) {
				set.status = 400;
				return { error: "CURRENT_PASSWORD_REQUIRED" };
			}
			return auth.api.changePassword({
				body: { currentPassword: body.currentPassword, newPassword: body.newPassword },
				headers: request.headers,
			});
		}

		return auth.api.setPassword({ body: { newPassword: body.newPassword }, headers: request.headers });
	})
	.post("/auth/change-email", async ({ request, set }) => {
		const session = await auth.api.getSession({ headers: request.headers });
		const canSetInitialEmail =
			session?.user.phoneNumberVerified && session.user.email.endsWith("@phone.local");

		if (!canSetInitialEmail) {
			set.status = 403;
			return { error: "EMAIL_CHANGE_FORBIDDEN" };
		}

		return auth.handler(request);
	})
	.all("/auth/*", ({ request, set }) => {
		if (new URL(request.url).pathname.endsWith("/auth/phone-number/send-otp")) {
			const otpOutcome = consume(request, {
				keyPrefix: "auth-phone-otp",
				max: 5,
				windowMs: timeConversion(10, "minutes", "milliseconds"),
			});
			if (!otpOutcome.allowed) {
				set.status = 429;
				if (otpOutcome.retryAfterSeconds) set.headers["Retry-After"] = String(otpOutcome.retryAfterSeconds);
				return { error: "RATE_LIMITED" };
			}
		}
		const outcome = consume(request, {
			keyPrefix: "auth",
			max: 1000,
			windowMs: timeConversion(1, "minutes", "milliseconds"),
		});

		if (!outcome.allowed) {
			set.status = 429;
			if (outcome.retryAfterSeconds) {
				set.headers["Retry-After"] = String(outcome.retryAfterSeconds);
			}
			return { error: "RATE_LIMITED" };
		}

		return auth.handler(request);
	})
	.use(OpenAPI);
