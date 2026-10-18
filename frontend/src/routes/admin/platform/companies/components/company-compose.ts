interface ComposeCompany {
	apiUrl: string | null;
	siteUrl: string | null;
	slug: string;
}

function caddyHost(value: string | null): string {
	if (!value) throw new Error("Deployment URLs are required.");
	const url = new URL(value);
	if (
		!["http:", "https:"].includes(url.protocol) ||
		url.username ||
		url.password ||
		url.pathname !== "/" ||
		url.search ||
		url.hash
	) {
		throw new Error("Deployment URLs must be HTTP(S) origins.");
	}
	return url.host;
}

/** Images contain company defaults; .env holds infrastructure secrets and optional runtime overrides. */
export function createCompanyCompose(company: ComposeCompany): string {
	if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(company.slug)) throw new Error("Invalid company slug.");
	const apiHost = caddyHost(company.apiUrl);
	const appHost = caddyHost(company.siteUrl);
	return `name: sim-delivery-${company.slug}
services:
  backend:
    image: jbmidia/sim-delivery_backend_${company.slug}:latest
    env_file: .env
    networks:
      - postgres
      - proxy
    restart: unless-stopped
    labels:
      caddy: ${JSON.stringify(apiHost)}
      caddy.reverse_proxy: "{{upstreams 3333}}"

  frontend:
    image: jbmidia/sim-delivery_frontend_${company.slug}:latest
    networks:
      - proxy
    restart: unless-stopped
    labels:
      caddy: ${JSON.stringify(appHost)}
      caddy.reverse_proxy: "{{upstreams 5173}}"

networks:
  postgres:
    external: true
  proxy:
    external: true
`;
}

export function downloadCompanyCompose(company: ComposeCompany) {
	const content = createCompanyCompose(company);
	const url = URL.createObjectURL(new Blob([content], { type: "application/yaml" }));
	const link = document.createElement("a");
	link.href = url;
	link.download = `compose.${company.slug}.yaml`;
	document.body.append(link);
	link.click();
	link.remove();
	setTimeout(() => URL.revokeObjectURL(url), 1000);
}
