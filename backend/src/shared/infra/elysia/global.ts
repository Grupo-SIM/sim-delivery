import "@/env";
import { mailProviders, resolveProvider, storageProviders } from "@hyoretsu/providers";
import { timeConversion } from "@hyoretsu/utils";
import Elysia from "elysia";
import type { ElysiaCookie } from "elysia/cookies";
import { ip } from "elysia-ip";
import { Cookies } from "../../types";
import { prisma } from "../sql";

const isDev = process.env.NODE_ENV === "development";

export const GlobalPlugin = new Elysia({
	name: "GlobalPlugin",
})
	.use(ip({ headersFirst: true }))
	.guard({
		cookie: Cookies,
	})
	.decorate({
		mailProvider: await resolveProvider(mailProviders, process.env.MAIL_DRIVER),
		prisma,
		storageProvider: await resolveProvider(storageProviders, process.env.STORAGE_DRIVER),
	})
	.derive(() => ({
		setCookies: {} as Record<string, string | ElysiaCookie>,
	}))
	.onAfterHandle(({ cookie, responseValue, setCookies }) => {
		if (setCookies) {
			for (let [name, options] of Object.entries(setCookies)) {
				if (typeof options !== "object") {
					options = { value: options };
				}

				options.domain ??= process.env.BASE_DOMAIN || process.env.DOMAIN || "localhost";
				options.httpOnly ??= true;
				options.maxAge ??= timeConversion(400, "days", "seconds");
				options.path ??= "/";
				options.sameSite ??= isDev ? "lax" : "none";
				options.secure ??= !isDev;

				cookie[name]?.set(options);
			}
		}

		return responseValue === undefined ? {} : responseValue;
	})
	.as("global");
