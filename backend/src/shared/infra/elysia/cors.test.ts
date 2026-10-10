import { describe, expect, test } from "bun:test";
import Elysia from "elysia";
import { createCors } from "./cors";

const origin = "https://delivery.zerograusorvetesac.com";
function request(method = "OPTIONS") {
 return new Request("http://localhost/orders/payment/track?slug=zero-grau", {
  method,
  headers: { Origin: origin, "Access-Control-Request-Method": "GET", "Access-Control-Request-Headers": "content-type,x-time-zone" },
 });
}
function app(whitelist?: string) {
 return new Elysia().use(createCors(true, whitelist)).get("/orders/:id/track", () => ({ status: "confirmed" }));
}
describe("checkout CORS", () => {
 test("reflects default wildcard origin for credentialed preflight", async () => {
  const response = await app().handle(request());
  expect(response.status).toBe(204);
  expect(response.headers.get("access-control-allow-origin")).toBe(origin);
  expect(response.headers.get("access-control-allow-credentials")).toBe("true");
  expect(response.headers.get("access-control-allow-headers")).toContain("x-time-zone");
 });
 test("normalizes configured origins for preflight and tracking response", async () => {
  const server = app(` https://other.example, ${origin}/ `);
  for (const method of ["OPTIONS", "GET"]) {
   const response = await server.handle(request(method));
   expect(response.headers.get("access-control-allow-origin")).toBe(origin);
  }
 });
 test("keeps explicit whitelist restricted", async () => {
  const response = await app("https://other.example").handle(request());
  expect(response.headers.get("access-control-allow-origin")).toBeNull();
 });
});
