import openapi from "@elysiajs/openapi";
import Elysia from "elysia";
import packageJson from "@/../../package.json" with { type: "json" };

export const docsPath = "/docs";

const meta = packageJson as { name: string; version?: string };

export const OpenAPI = new Elysia().use(
	openapi({
		documentation: {
			info: {
				title: process.env.APP_NAME || meta.name,
				version: meta.version ?? "0.0.0",
			},
		},
		path: docsPath,
	}),
);
