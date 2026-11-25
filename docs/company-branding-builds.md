# Company branding builds

`COMPANY_SLUG` remains mandatory for backend preparation. Frontend accepts `COMPANY_SLUG`, falling back to `VITE_COMPANY_SLUG`. Empty selections and unknown companies fail; there is no neutral tenant deployment. `DATABASE_URL` must point to the intended database. Preparation reads company configuration; it does not migrate or seed databases.

Direct package dev, build, type-check, backend export and native entrypoints prepare branding before starting their underlying command. Turbo passes both selectors and frontend URL fallbacks through these entrypoints. Restart dev watchers after changing company or branding. Database-backed preparation and consuming builds/type-checks are uncached, so changing branding does not require a source commit.

Frontend canonical HTML and native configuration live in `frontend/scripts/defaults/`. Edit these files for structural defaults, rather than generated `frontend/index.html` or `frontend/src-tauri/tauri.conf.json`. Each preparation derives company metadata from canonical inputs, downloads assets and generates icons in a temporary directory before publishing. Previous logo/mobile-icon extensions and native icon directories are removed when publishing; unavailable or omitted artwork produces empty web/native icons instead of retaining another company's artwork. Downloads retain existing best-effort behavior.

Keep one company build per checkout at a time: generated files are shared within that checkout. Use isolated worktrees for concurrent company builds. CI keeps newline-separated `VARIANTS`, legacy workflow fallback, required company variants and existing image names. Docker builds keep `COMPANY_SLUG` and `BRANDING_REVISION`; change the latter when rebuilding database-only branding changes to invalidate Docker layers. No schema or deployment changes are required.

## Static frontend delivery

The frontend runtime uses Nginx on port 5173, configured in `frontend/nginx.conf`. HTML, SPA navigation and mutable public files (including `branding.css` and logos) revalidate on every request. Successful content-hashed files under `/assets/` use immutable caching; missing assets return 404 without long-lived caching. They must never receive the SPA entrypoint as a successful CSS or JavaScript response. Nginx gzips text assets (`gzip_types` in `frontend/nginx.conf`); a reverse proxy in front, such as Caddy, may compress as well (`encode zstd gzip`) and skips responses already encoded.

The Vite build inlines `public/branding.css` into `index.html` as a `<style>` block to remove one render-blocking request; the file is still emitted and served at `/branding.css`.

After starting a local runtime, run `bun run --cwd frontend check:static http://127.0.0.1:5173`. This checks entrypoint assets, CSS content/types, cache headers, branding, SPA navigation and missing-file behavior. The same read-only check accepts a deployed URL.

All proxy upstreams/replicas for one company must serve the same image version. Alternating entrypoint hashes on repeated cache-busted requests indicates inconsistent deployment targets; cache headers cannot repair that. Replace stale replicas/upstreams before considering the deployment complete. Proxies must preserve origin cache headers. Previously cached HTML/branding or HTML returned at asset URLs may require invalidating existing proxy/browser cache after deploying this fix.

## In-app desktop updates

Installed desktop apps update themselves through `tauri-plugin-updater`; admins install once and never again. `DesktopUpdateBanner` (mounted in `__root.tsx`) checks on launch and every 6 hours, then offers "Atualizar e reiniciar".

One-time setup (the maintainer runs these, nothing here leaves the machine automatically):

1. `bunx tauri signer generate -w ~/.tauri/updater.key` creates the signing key pair.
2. Repository secrets `TAURI_SIGNING_PRIVATE_KEY` (file contents), `TAURI_SIGNING_PRIVATE_KEY_PASSWORD`, `S3_ACCESS_KEY_ID` and `S3_SECRET_ACCESS_KEY`; repository variables `TAURI_UPDATER_PUBKEY` (the `.pub` contents), `VITE_CDN_URL`, `S3_BUCKET`, `S3_ENDPOINT` and optionally `S3_PREFIX` (same values as the backend media bucket).
3. Keep the private key forever: apps signed with a different key can never update. Losing it forces a manual reinstall.

How it works: when `TAURI_UPDATER_PUBKEY` is set (and `VITE_CDN_URL` is configured), `frontend/scripts/inject.ts` adds `plugins.updater` and `bundle.createUpdaterArtifacts` to the generated `tauri.conf.json` with the endpoint `<VITE_CDN_URL>/updates/<slug>/latest.json`. The repository is private, so the CD `desktop` job signs the installers, then uploads them to `updates/<slug>/<version>/` in the public media bucket and publishes a `latest.json` whose URLs point at the CDN (manifest last, so clients never see missing files). The signature protects integrity, so the bucket can be public. Builds without the key work as before but never offer updates. Bump `version` in `frontend/scripts/defaults/tauri.conf.json` for every release: the updater only offers strictly higher versions.
