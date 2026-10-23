import { createCipheriv, createDecipheriv, hkdfSync, randomBytes } from "node:crypto";

function dedicatedKey() {
	const raw = process.env.SIMPAY_CREDENTIALS_ENCRYPTION_KEY;
	if (!raw || !/^[a-f0-9]{64}$/i.test(raw)) throw new Error("SIMPAY_CREDENTIALS_ENCRYPTION_KEY deve conter 32 bytes em hexadecimal");
	return Buffer.from(raw, "hex");
}

function authKey(version?: string) {
	const raw = process.env.BETTER_AUTH_SECRETS;
	if (!raw?.trim()) throw new Error("Configure BETTER_AUTH_SECRETS ou SIMPAY_CREDENTIALS_ENCRYPTION_KEY para proteger credenciais SIM INT PAY");
	const secrets = raw.split(",").map(entry => {
		const separator = entry.indexOf(":");
		const id = entry.slice(0, separator).trim();
		const secret = entry.slice(separator + 1).trim();
		if (separator < 0 || !/^(0|[1-9]\d*)$/.test(id) || !secret) throw new Error("BETTER_AUTH_SECRETS deve conter versões e segredos válidos");
		return { id, secret };
	});
	if (new Set(secrets.map(secret => secret.id)).size !== secrets.length) throw new Error("BETTER_AUTH_SECRETS contém versões duplicadas");
	const selected = version === undefined ? secrets[0] : secrets.find(secret => secret.id === version);
	if (!selected || selected.secret.length < 32) throw new Error("Mantenha a versão original de BETTER_AUTH_SECRETS com pelo menos 32 caracteres para ler credenciais SIM INT PAY");
	return {
		version: selected.id,
		key: Buffer.from(hkdfSync("sha256", selected.secret, "sim-delivery", "simpay-credentials:v2", 32)),
	};
}

export function encryptSimpaySecret(value: string) {
	const derived = process.env.SIMPAY_CREDENTIALS_ENCRYPTION_KEY ? null : authKey();
	const prefix = derived ? `v2:${derived.version}` : "v1";
	const iv = randomBytes(12);
	const cipher = createCipheriv("aes-256-gcm", derived?.key ?? dedicatedKey(), iv);
	if (derived) cipher.setAAD(Buffer.from(prefix));
	const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
	return [prefix, iv.toString("hex"), cipher.getAuthTag().toString("hex"), encrypted.toString("hex")].join(":");
}

export function decryptSimpaySecret(value: string) {
	const parts = value.split(":");
	const version = parts[0];
	const derived = version === "v2";
	const [iv, tag, data] = parts.slice(derived ? 2 : 1);
	if ((!derived && version !== "v1") || parts.length !== (derived ? 5 : 4) || !iv || !/^[a-f0-9]{24}$/i.test(iv) || !tag || !/^[a-f0-9]{32}$/i.test(tag) || data === undefined || !/^(?:[a-f0-9]{2})*$/i.test(data)) throw new Error("Credencial SIM INT PAY inválida");
	const decipher = createDecipheriv("aes-256-gcm", derived ? authKey(parts[1]).key : dedicatedKey(), Buffer.from(iv, "hex"));
	if (derived) decipher.setAAD(Buffer.from(parts.slice(0, 2).join(":")));
	decipher.setAuthTag(Buffer.from(tag, "hex"));
	return Buffer.concat([decipher.update(Buffer.from(data, "hex")), decipher.final()]).toString("utf8");
}
