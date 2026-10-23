import { afterEach, beforeEach, expect, test } from "bun:test";
import { decryptSimpaySecret, encryptSimpaySecret } from "./simpay-secrets";

const previous = { dedicated: process.env.SIMPAY_CREDENTIALS_ENCRYPTION_KEY, auth: process.env.BETTER_AUTH_SECRETS };
const original = "original-auth-secret-with-at-least-32-characters";
const rotated = "rotated-auth-secret-with-at-least-32-characters";
beforeEach(() => {
	delete process.env.SIMPAY_CREDENTIALS_ENCRYPTION_KEY;
	process.env.BETTER_AUTH_SECRETS = `1:${original}`;
});
afterEach(() => {
	if (previous.dedicated === undefined) delete process.env.SIMPAY_CREDENTIALS_ENCRYPTION_KEY;
	else process.env.SIMPAY_CREDENTIALS_ENCRYPTION_KEY = previous.dedicated;
	if (previous.auth === undefined) delete process.env.BETTER_AUTH_SECRETS;
	else process.env.BETTER_AUTH_SECRETS = previous.auth;
});

test("encrypts credentials without an additional environment variable", () => {
	const encrypted = encryptSimpaySecret("provider-access-token");
	expect(encrypted).toStartWith("v2:1:");
	expect(encrypted).not.toContain("provider-access-token");
	expect(decryptSimpaySecret(encrypted)).toBe("provider-access-token");
	expect(encryptSimpaySecret("provider-access-token")).not.toBe(encrypted);
});
test("retains old credentials across auth secret rotation and later dedicated-key configuration", () => {
	const encrypted = encryptSimpaySecret("provider-token");
	process.env.BETTER_AUTH_SECRETS = `2:${rotated},1:${original}`;
	expect(decryptSimpaySecret(encrypted)).toBe("provider-token");
	const next = encryptSimpaySecret("next-provider-token");
	expect(next).toStartWith("v2:2:");
	process.env.SIMPAY_CREDENTIALS_ENCRYPTION_KEY = "ab".repeat(32);
	expect(decryptSimpaySecret(encrypted)).toBe("provider-token");
	expect(decryptSimpaySecret(next)).toBe("next-provider-token");
	expect(encryptSimpaySecret("dedicated-token")).toStartWith("v1:");
});
test("preserves legacy dedicated-key ciphertext independently of auth secrets", () => {
	process.env.SIMPAY_CREDENTIALS_ENCRYPTION_KEY = "ab".repeat(32);
	const encrypted = encryptSimpaySecret("legacy-token");
	process.env.BETTER_AUTH_SECRETS = `2:${rotated}`;
	expect(decryptSimpaySecret(encrypted)).toBe("legacy-token");
	delete process.env.SIMPAY_CREDENTIALS_ENCRYPTION_KEY;
	expect(() => decryptSimpaySecret(encrypted)).toThrow("SIMPAY_CREDENTIALS_ENCRYPTION_KEY");
});
test("rejects changed, removed or tampered secret versions", () => {
	const encrypted = encryptSimpaySecret("provider-token");
	process.env.BETTER_AUTH_SECRETS = `1:${rotated}`;
	expect(() => decryptSimpaySecret(encrypted)).toThrow();
	process.env.BETTER_AUTH_SECRETS = `2:${rotated}`;
	expect(() => decryptSimpaySecret(encrypted)).toThrow("versão original");
	process.env.BETTER_AUTH_SECRETS = `2:${original},1:${original}`;
	expect(() => decryptSimpaySecret(encrypted.replace("v2:1:", "v2:2:"))).toThrow();
});
test("rejects missing, weak, malformed or duplicate auth secrets without exposing them", () => {
	for (const value of [undefined, "1:secret", "not-a-versioned-secret", `x:${original}`, `1:${original},1:${rotated}`]) {
		if (value === undefined) delete process.env.BETTER_AUTH_SECRETS;
		else process.env.BETTER_AUTH_SECRETS = value;
		expect(() => encryptSimpaySecret("provider-token")).toThrow("BETTER_AUTH_SECRETS");
	}
});
test("does not ignore an explicitly configured invalid dedicated key", () => {
	process.env.SIMPAY_CREDENTIALS_ENCRYPTION_KEY = "invalid";
	expect(() => encryptSimpaySecret("provider-token")).toThrow("SIMPAY_CREDENTIALS_ENCRYPTION_KEY");
});
test("rejects malformed ciphertext and accepts authenticated empty secrets", () => {
	for (const value of ["", "v3:a:b:c", "v2:1:a:b:c", "v1:a:b:c", `v2:1:${"ab".repeat(12)}:${"cd".repeat(16)}:z`, "v2:1:extra:a:b:c"]) {
		expect(() => decryptSimpaySecret(value)).toThrow("Credencial SIM INT PAY inválida");
	}
	expect(decryptSimpaySecret(encryptSimpaySecret(""))).toBe("");
});
