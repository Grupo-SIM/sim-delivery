import { describe, expect, it } from "bun:test";
import { createCompanyCompose } from "./company-compose";

const company = {
	apiUrl: "https://api.delivery.example.com",
	siteUrl: "https://delivery.example.com/",
	slug: "zero-grau",
};

describe("company Docker Compose", () => {
	it("uses branded images and Caddy hosts, keeping runtime secrets on the backend", () => {
		const compose = createCompanyCompose(company);
		const parsed = Bun.YAML.parse(compose) as {
			services: Record<string, { image: string; env_file?: string; labels: Record<string, string> }>;
			networks: Record<string, { external: boolean }>;
		};
		expect(parsed.services.backend.image).toBe("jbmidia/sim-delivery_backend_zero-grau:latest");
		expect(parsed.services.frontend.image).toBe("jbmidia/sim-delivery_frontend_zero-grau:latest");
		expect(parsed.services.backend.labels.caddy).toBe("api.delivery.example.com");
		expect(parsed.services.frontend.labels.caddy).toBe("delivery.example.com");
		expect(parsed.services.backend.labels["caddy.reverse_proxy"]).toBe("{{upstreams 3333}}");
		expect(parsed.services.backend.env_file).toBe(".env");
		expect(parsed.services.frontend.env_file).toBeUndefined();
		expect(parsed.networks.proxy.external).toBe(true);
		expect(compose).not.toContain("OWNER_PASSWORD");
	});
	it("rejects incomplete URLs, credential leaks, paths and invalid slugs", () => {
		for (const apiUrl of [
			null,
			"ftp://example.com",
			"https://user:secret@example.com",
			"https://example.com/path",
			"https://example.com?x=1",
			"https://example.com#test",
		]) {
			expect(() => createCompanyCompose({ ...company, apiUrl })).toThrow();
		}
		expect(() => createCompanyCompose({ ...company, slug: "bad: slug" })).toThrow();
		expect(() => createCompanyCompose({ ...company, siteUrl: null })).toThrow();
	});
});
