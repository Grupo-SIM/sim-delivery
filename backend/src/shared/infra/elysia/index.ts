import cors from "@elysiajs/cors";
import staticPlugin from "@elysiajs/static";
import { timeConversion } from "@hyoretsu/utils";
import Elysia from "elysia";
import { envSchema } from "@/env";
import { DomainError } from "@/shared/errors/DomainError";
import { auth } from "@/shared/infra/betterAuth";
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
				process.env.NODE_ENV === "production"
					? process.env.CORS_WHITELIST?.split(",").filter(Boolean)
					: true,
		}),
		staticPlugin({
			assets: process.env.STATIC_DIR!,
			prefix: "/static",
		}),
		GlobalPlugin,
	])
	.all("/auth/*", ({ request, set }) => {
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
