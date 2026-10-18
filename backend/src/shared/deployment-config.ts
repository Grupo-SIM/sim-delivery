/** Public deployment settings only. Passwords, tokens and database credentials stay in runtime secrets. */
export type DeploymentDefaults = Partial<
	Record<"API_URL" | "APP_URL" | "COMPANY_SLUG" | "OWNER_EMAIL" | "OWNER_NAME", string>
>;

interface DeploymentCompany {
	apiUrl: string | null;
	siteUrl: string | null;
	name: string;
	slug: string;
	ownerEmail: string | null;
}

function deploymentOrigin(value: string | null, field: string): string {
	if (!value?.trim()) throw new Error(`${field} is required in company deployment settings.`);
	const url = new URL(value.trim());
	if (
		!["http:", "https:"].includes(url.protocol) ||
		url.username ||
		url.password ||
		url.pathname !== "/" ||
		url.search ||
		url.hash
	) {
		throw new Error(`${field} must be an HTTP(S) origin without credentials, path, query or fragment.`);
	}
	return url.origin;
}

export function createDeploymentDefaults(company: DeploymentCompany): DeploymentDefaults {
	if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(company.slug)) throw new Error("Invalid company slug.");
	return {
		API_URL: deploymentOrigin(company.apiUrl, "apiUrl"),
		APP_URL: deploymentOrigin(company.siteUrl, "siteUrl"),
		COMPANY_SLUG: company.slug,
		OWNER_NAME: company.name,
		...(company.ownerEmail?.trim() && { OWNER_EMAIL: company.ownerEmail.trim().toLowerCase() }),
	};
}

/** Apply before env validation and before importing auth/CORS/WhatsApp clients. Explicit runtime values win. */
export function applyDeploymentDefaults(
	env: Record<string, string | undefined>,
	defaults: DeploymentDefaults,
) {
	for (const [key, value] of Object.entries(defaults)) {
		if (!env[key]?.trim()) env[key] = value;
	}
	const derived = {
		BETTER_AUTH_URL: env.API_URL,
		CORS_WHITELIST: env.APP_URL ? new URL(env.APP_URL).origin : undefined,
		WAHA_SESSION: env.COMPANY_SLUG,
	};
	for (const [key, value] of Object.entries(derived)) {
		if (value && !env[key]?.trim()) env[key] = value;
	}
}
