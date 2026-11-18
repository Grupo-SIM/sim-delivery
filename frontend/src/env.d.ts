/// <reference types="vite/client" />

interface ImportMetaEnv {
	/** Whitelabel company identifier baked into each build; resolves the served company (docs/02). */
	/** Public CDN base URL (including any path) serving media; unset disables image classes. */
	readonly VITE_CDN_URL?: string;
	readonly VITE_COMPANY_SLUG?: string;
}

interface ImportMeta {
	readonly env: ImportMetaEnv;
}
