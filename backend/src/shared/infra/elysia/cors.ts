import cors from "@elysiajs/cors";

export function createCors(production: boolean, whitelist?: string) {
 const origins = (whitelist ?? "*").split(",").map(value => value.trim().replace(/\/+$/, "")).filter(Boolean);
 return cors({
  credentials: true,
  // Reflect wildcard origins: browsers reject '*' when credentials are included.
  origin: !production || origins.includes("*") ? true : origins,
 });
}
