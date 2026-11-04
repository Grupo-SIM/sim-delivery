import cors from "@elysiajs/cors";

/** Origins of the Tauri webviews (desktop macOS/Linux, Windows/Android), which always call the remote API. */
export const TAURI_ORIGINS = ["tauri://localhost", "http://tauri.localhost", "https://tauri.localhost"];

export function createCors(production: boolean, whitelist?: string) {
 const origins = [...(whitelist ?? "*").split(",").map(value => value.trim().replace(/\/+$/, "")).filter(Boolean), ...TAURI_ORIGINS];
 return cors({
  credentials: true,
  // Reflect wildcard origins: browsers reject '*' when credentials are included.
  origin: !production || origins.includes("*") ? true : origins,
 });
}
