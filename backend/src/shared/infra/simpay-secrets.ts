import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
function key() {
	const raw = process.env.SIMPAY_CREDENTIALS_ENCRYPTION_KEY;
	if (!raw || !/^[a-f0-9]{64}$/i.test(raw)) throw new Error("SIMPAY_CREDENTIALS_ENCRYPTION_KEY deve conter 32 bytes em hexadecimal");
	return Buffer.from(raw, "hex");
}
export function encryptSimpaySecret(value: string) {
	const iv = randomBytes(12);
	const cipher = createCipheriv("aes-256-gcm", key(), iv);
	const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
	return ["v1", iv.toString("hex"), cipher.getAuthTag().toString("hex"), encrypted.toString("hex")].join(":");
}
export function decryptSimpaySecret(value: string) {
	const [version, iv, tag, data] = value.split(":");
	if (version !== "v1" || !iv || !tag || data === undefined) throw new Error("Credencial SIM INT PAY inválida");
	const decipher = createDecipheriv("aes-256-gcm", key(), Buffer.from(iv, "hex"));
	decipher.setAuthTag(Buffer.from(tag, "hex"));
	return Buffer.concat([decipher.update(Buffer.from(data, "hex")), decipher.final()]).toString("utf8");
}
