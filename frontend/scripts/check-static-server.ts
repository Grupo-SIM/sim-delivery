import assert from "node:assert/strict";

// Read-only HTTP smoke check. Run against a local runtime or a deployed frontend.
const baseUrl = process.argv[2] ?? "http://127.0.0.1:5173";

async function get(path: string) {
	const response = await fetch(new URL(path, baseUrl), {
		cache: "no-store",
		headers: { "Cache-Control": "no-cache" },
		signal: AbortSignal.timeout(15_000),
	});
	return { response, body: await response.text() };
}

function expectRevalidation(response: Response) {
	assert.match(response.headers.get("cache-control") ?? "", /\bno-cache\b/, `${response.url} must revalidate`);
}

const { response: index, body: html } = await get("/");
assert.equal(index.status, 200);
assert.match(index.headers.get("content-type") ?? "", /text\/html/);
expectRevalidation(index);

const assets = [...html.matchAll(/(?:src|href)="(\/assets\/[^"?]+\.(?:css|js))"/g)].map(match => match[1]!);
assert(assets.some(path => path.endsWith(".css")), "index must reference a built stylesheet");
assert(assets.some(path => path.endsWith(".js")), "index must reference a built script");

for (const path of assets) {
	const { response, body } = await get(path);
	assert.equal(response.status, 200, path);
	assert.match(response.headers.get("content-type") ?? "", path.endsWith(".css") ? /text\/css/ : /javascript/, path);
	assert.match(response.headers.get("cache-control") ?? "", /\bimmutable\b/, path);
	assert(!/^\s*<!doctype html/i.test(body), `${path} returned SPA HTML`);
	if (path.endsWith(".css")) {
		assert(body.includes(".flex{"), "built CSS must contain Tailwind utilities");
		assert(body.includes(".storefront"), "built CSS must contain storefront styles");
	}
}

const { response: branding, body: brandingCss } = await get("/branding.css");
assert.equal(branding.status, 200);
assert.match(branding.headers.get("content-type") ?? "", /text\/css/);
assert(brandingCss.includes("--primary:"), "branding stylesheet must contain company colors");
expectRevalidation(branding);

// Cache-busted probes also catch proxies alternating between stale replicas.
for (const path of ["/login", "/admin/products", ...Array.from({ length: 4 }, (_, i) => `/?static-check=${Date.now()}-${i}`)]) {
	const { response, body } = await get(path);
	assert.equal(response.status, 200, path);
	assert.equal(body, html, `${path} must serve the current SPA entrypoint`);
	expectRevalidation(response);
}

for (const path of ["/assets/__missing__.css", "/assets/__missing__.js", "/__missing__.css"]) {
	const { response, body } = await get(path);
	assert.equal(response.status, 404, `${path} must not fall back to the SPA`);
	assert.notEqual(body, html, path);
	assert.match(response.headers.get("cache-control") ?? "", /\bno-(?:store|cache)\b/, path);
}

console.log(`Static frontend checks passed: ${baseUrl}`);
