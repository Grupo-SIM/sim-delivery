/// <reference types="vite/client" />

interface ImportMetaEnv {
	/** Whitelabel company identifier baked into each build; resolves the served company (docs/02). */
	readonly VITE_COMPANY_SLUG?: string;
}

interface ImportMeta {
	readonly env: ImportMetaEnv;
}
