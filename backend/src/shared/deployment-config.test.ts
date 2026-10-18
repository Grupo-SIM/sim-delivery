import { describe, expect, it } from "bun:test";
import { applyDeploymentDefaults, createDeploymentDefaults } from "./deployment-config";

const company = {
	apiUrl: "https://api.example.com/",
	name: "Example",
	ownerEmail: "Owner@Example.com",
	siteUrl: "https://example.com/",
	slug: "example",
};

describe("company deployment defaults", () => {
	it("bakes only deployment identity and public URLs, then derives auth, CORS and WAHA before startup", () => {
		const defaults = createDeploymentDefaults(company);
		expect(defaults).toEqual({
			API_URL: "https://api.example.com",
			APP_URL: "https://example.com",
			COMPANY_SLUG: "example",
			OWNER_EMAIL: "owner@example.com",
			OWNER_NAME: "Example",
		});
		const env: Record<string, string | undefined> = {};
		applyDeploymentDefaults(env, defaults);
		expect(env).toEqual({
			...defaults,
			BETTER_AUTH_URL: "https://api.example.com",
			CORS_WHITELIST: "https://example.com",
			WAHA_SESSION: "example",
		});
	});
	it("derives dependent values from runtime overrides", () => {
		const env: Record<string, string | undefined> = {
			API_URL: "https://api.override.com",
			APP_URL: "https://override.com/",
			COMPANY_SLUG: "override",
			OWNER_EMAIL: "runtime@example.com",
			OWNER_NAME: "Runtime",
		};
		applyDeploymentDefaults(env, createDeploymentDefaults(company));
		expect(env.BETTER_AUTH_URL).toBe("https://api.override.com");
		expect(env.CORS_WHITELIST).toBe("https://override.com");
		expect(env.WAHA_SESSION).toBe("override");
		expect(env.OWNER_NAME).toBe("Runtime");
		expect(env.OWNER_EMAIL).toBe("runtime@example.com");
	});
	it("preserves explicit auth, CORS and WhatsApp settings and runtime secrets", () => {
		const env = {
			BETTER_AUTH_URL: "https://auth.example.com",
			CORS_WHITELIST: "https://one.example.com,https://two.example.com",
			DATABASE_URL: "postgresql://local/test",
			OWNER_PASSWORD: "runtime-secret",
			WAHA_SESSION: "existing-session",
		};
		applyDeploymentDefaults(env, createDeploymentDefaults(company));
		expect(env.BETTER_AUTH_URL).toBe("https://auth.example.com");
		expect(env.CORS_WHITELIST).toBe("https://one.example.com,https://two.example.com");
		expect(env.WAHA_SESSION).toBe("existing-session");
		expect(env.OWNER_PASSWORD).toBe("runtime-secret");
		expect(env.DATABASE_URL).toBe("postgresql://local/test");
	});
	it("supports an unconfigured checkout without inventing tenant or owner data", () => {
		const env = {};
		applyDeploymentDefaults(env, {});
		expect(env).toEqual({});
		const defaults = createDeploymentDefaults({ ...company, ownerEmail: null });
		expect(defaults.OWNER_EMAIL).toBeUndefined();
	});
	it("rejects incomplete or unsafe build settings", () => {
		for (const apiUrl of [
			null,
			"",
			"ftp://example.com",
			"https://user:password@example.com",
			"https://example.com/path",
			"https://example.com?query=1",
			"https://example.com#fragment",
		]) {
			expect(() => createDeploymentDefaults({ ...company, apiUrl })).toThrow();
		}
		expect(() => createDeploymentDefaults({ ...company, siteUrl: null })).toThrow();
		expect(() => createDeploymentDefaults({ ...company, slug: "bad\nslug" })).toThrow();
	});
});
