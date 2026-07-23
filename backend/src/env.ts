import path from "node:path";
import { MailProvidersEnum, StorageProvidersEnum } from "@hyoretsu/providers";
import { Value } from "@sinclair/typebox/value";
import { t, type UnwrapSchema } from "elysia";
import { PhoneOtpProvidersEnum } from "@/shared/infra/phoneOtp";
import { NodeEnv } from "@/shared/types";

const defaultPort = "3333";
const port = (process.env.PORT ?? defaultPort) as string;

const defaultApiUrl = `http://localhost:${port}`;
const apiUrl = (process.env.API_URL ?? defaultApiUrl) as string;

export const envSchema = t.Object({
	ADMIN_EMAIL: t.Optional(t.String()),
	ADMIN_NAME: t.Optional(t.String()),
	ADMIN_PASSWORD: t.Optional(t.String()),
	API_URL: t.String({
		default: defaultApiUrl,
		format: "uri",
	}),
	APP_URL: t.String({
		default: "http://localhost:3000",
		format: "uri",
	}),
	BETTER_AUTH_SECRETS: t.String({ default: "1:secret" }),
	BETTER_AUTH_URL: t.String({ default: `${apiUrl}` }),
	CORS_WHITELIST: t.String({ default: "*" }),
	DATABASE_TEST_URL: t.Optional(
		t.String({
			default: "postgresql://postgres:password@localhost:5432/vivendo_de_bet_test",
			format: "uri",
		}),
	),
	DATABASE_URL: t.String({
		default: "postgresql://postgres:password@localhost:5432/vivendo_de_bet",
		format: "uri",
	}),
	DOM_API_KEY: t.Optional(t.String()),
	MAIL_DRIVER: t.Enum(MailProvidersEnum),
	MAIL_FROM: t.Optional(t.String({ format: "email" })),
	MAIL_HOST: t.String(),
	MAIL_PASS: t.String(),
	MAIL_PORT: t.String(),
	MAIL_USER: t.String(),
	NODE_ENV: t.Optional(
		t.Enum(NodeEnv, {
			default: NodeEnv.Production,
		}),
	),
	PHONE_OTP_DRIVER: t.Enum(PhoneOtpProvidersEnum, { default: PhoneOtpProvidersEnum.CONSOLE }),
	PORT: t.Optional(t.Numeric({ default: defaultPort })),
	RESEND_API_KEY: t.Optional(t.String()),
	S3_ACCESS_KEY_ID: t.Optional(t.String()),
	S3_BUCKET: t.Optional(t.String()),
	S3_ENDPOINT: t.Optional(
		t.String({
			format: "uri",
		}),
	),
	S3_SECRET_ACCESS_KEY: t.Optional(t.String()),
	SIMPAY_API_URL: t.Optional(
		t.String({
			default: "https://simpay-back.simintermediacoes.com",
			format: "uri",
		}),
	),
	STATIC_DIR: t.Optional(
		t.String({
			default: path.resolve(__dirname, "..", "static"),
		}),
	),
	STORAGE_DRIVER: t.Enum(StorageProvidersEnum),
	TWILIO_ACCOUNT_SID: t.Optional(t.String()),
	TWILIO_AUTH_TOKEN: t.Optional(t.String()),
	TWILIO_FROM_NUMBER: t.Optional(t.String()),
	WHATSAPP_ACCESS_TOKEN: t.Optional(t.String()),
	WHATSAPP_API_VERSION: t.Optional(t.String({ default: "v23.0" })),
	WHATSAPP_DRIVER: t.Optional(t.String({ default: "disabled" })),
	WHATSAPP_PHONE_NUMBER_ID: t.Optional(t.String()),
	WHATSAPP_TEMPLATE_LANGUAGE: t.Optional(t.String({ default: "pt_BR" })),
	WHATSAPP_TEMPLATE_NAME: t.Optional(t.String()),
});

declare global {
	namespace NodeJS {
		interface ProcessEnv extends Omit<UnwrapSchema<typeof envSchema>, "NODE_ENV"> {}
	}
}

Value.Default(envSchema, process.env);
