import { describe, expect, it } from "bun:test";
import { createAuthFetch } from "./auth-fetch";

describe("createAuthFetch", () => {
	it("retries a failed session read once", async () => {
		let calls = 0;
		const authFetch = createAuthFetch(async () => {
			calls += 1;
			return new Response(null, { status: calls === 1 ? 500 : 200 });
		});

		expect((await authFetch("https://api.example.com/auth/get-session")).status).toBe(200);
		expect(calls).toBe(2);
	});

	it("retries a session read after a transport failure", async () => {
		let calls = 0;
		const authFetch = createAuthFetch(async () => {
			calls += 1;
			if (calls === 1) throw new TypeError("fetch failed");
			return new Response(null, { status: 200 });
		});

		expect((await authFetch("https://api.example.com/auth/get-session")).status).toBe(200);
		expect(calls).toBe(2);
	});

	it("does not retry non-session requests or mutations", async () => {
		let calls = 0;
		const authFetch = createAuthFetch(async () => {
			calls += 1;
			return new Response(null, { status: 500 });
		});

		await authFetch("https://api.example.com/auth/sign-in/email", { method: "POST" });
		await authFetch("https://api.example.com/api/orders");
		expect(calls).toBe(2);
	});
});
