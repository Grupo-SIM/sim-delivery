# Company branding builds

`COMPANY_SLUG` remains mandatory for backend preparation. Frontend accepts `COMPANY_SLUG`, falling back to `VITE_COMPANY_SLUG`. Empty selections and unknown companies fail; there is no neutral tenant deployment. `DATABASE_URL` must point to the intended database. Preparation reads company configuration; it does not migrate or seed databases.

Direct package dev, build, type-check, backend export and native entrypoints prepare branding before starting their underlying command. Turbo passes both selectors and frontend URL fallbacks through these entrypoints. Restart dev watchers after changing company or branding. Database-backed preparation and consuming builds/type-checks are uncached, so changing branding does not require a source commit.

Frontend canonical HTML and native configuration live in `frontend/scripts/defaults/`. Edit these files for structural defaults, rather than generated `frontend/index.html` or `frontend/src-tauri/tauri.conf.json`. Each preparation derives company metadata from canonical inputs, downloads assets and generates icons in a temporary directory before publishing. Previous logo/mobile-icon extensions and native icon directories are removed when publishing; unavailable or omitted artwork produces empty web/native icons instead of retaining another company's artwork. Downloads retain existing best-effort behavior.

Keep one company build per checkout at a time: generated files are shared within that checkout. Use isolated worktrees for concurrent company builds. CI keeps newline-separated `VARIANTS`, legacy workflow fallback, required company variants and existing image names. Docker builds keep `COMPANY_SLUG` and `BRANDING_REVISION`; change the latter when rebuilding database-only branding changes to invalidate Docker layers. No schema or deployment changes are required.

## Static frontend delivery

The frontend runtime uses Nginx on port 5173, configured in `frontend/nginx.conf`. HTML, SPA navigation and mutable public files (including `branding.css` and logos) revalidate on every request. Successful content-hashed files under `/assets/` use immutable caching; missing assets return 404 without long-lived caching. They must never receive the SPA entrypoint as a successful CSS or JavaScript response.

After starting a local runtime, run `bun run --cwd frontend check:static http://127.0.0.1:5173`. This checks entrypoint assets, CSS content/types, cache headers, branding, SPA navigation and missing-file behavior. The same read-only check accepts a deployed URL.

All proxy upstreams/replicas for one company must serve the same image version. Alternating entrypoint hashes on repeated cache-busted requests indicates inconsistent deployment targets; cache headers cannot repair that. Replace stale replicas/upstreams before considering the deployment complete. Proxies must preserve origin cache headers. Previously cached HTML/branding or HTML returned at asset URLs may require invalidating existing proxy/browser cache after deploying this fix.
