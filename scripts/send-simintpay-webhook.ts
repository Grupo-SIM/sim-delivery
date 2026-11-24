/**
 * Sends a signed SimIntPay `payment.updated` webhook by hand (manual production check).
 *
 * The signature is HMAC-SHA256(hex) of the exact raw body, sent in `x-simintpay-signature`,
 * keyed with the company's webhook secret. The target must be a real unpaid order whose Pix was
 * generated at checkout: `requestId` is its payment attempt id, `transactionId`/`paymentId` come from
 * the charge. Only the HTTP call leaves the machine; nothing else is touched.
 *
 * Usage:
 *   SIMINTPAY_WEBHOOK_SECRET=... bun scripts/send-simintpay-webhook.ts \
 *     --api https://backend.hyoretsu.com --company <companyId> --platform <platformId> \
 *     --request <paymentAttemptId> --transaction <transactionId> [--payment <paymentId>] \
 *     [--status APPROVED] [--dry-run]
 */
import { createHmac, randomUUID } from "node:crypto";
import { parseArgs } from "node:util";

const { values } = parseArgs({
	options: {
		api: { type: "string" },
		company: { type: "string" },
		"dry-run": { type: "boolean" },
		payment: { type: "string" },
		platform: { type: "string" },
		request: { type: "string" },
		status: { default: "APPROVED", type: "string" },
		transaction: { type: "string" },
	},
});

const secret = process.env.SIMINTPAY_WEBHOOK_SECRET;
const missing = ["api", "company", "platform", "request", "transaction"].filter(key => !values[key as keyof typeof values]);
if (!secret || missing.length > 0) {
	console.error(`Missing: ${[...(secret ? [] : ["env SIMINTPAY_WEBHOOK_SECRET"]), ...missing.map(key => `--${key}`)].join(", ")}`);
	process.exit(1);
}

const body = JSON.stringify({
	eventId: `manual-${randomUUID()}`,
	externalMerchantId: values.company,
	kind: "payment.updated",
	...(values.payment ? { paymentId: values.payment } : {}),
	platformId: values.platform,
	requestId: values.request,
	status: values.status,
	transactionId: values.transaction,
	updatedAt: new Date().toISOString(),
});
const signature = createHmac("sha256", secret!).update(body).digest("hex");
const url = `${values.api!.replace(/\/$/, "")}/integrations/simintpay/${values.company}/events`;

if (values["dry-run"]) {
	console.log(JSON.stringify({ body: JSON.parse(body), signature, url }, null, 2));
	process.exit(0);
}

const response = await fetch(url, { body, headers: { "content-type": "application/json", "x-simintpay-signature": signature }, method: "POST" });
console.log(response.status, await response.text());
