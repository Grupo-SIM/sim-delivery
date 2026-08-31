import { describe, expect, it } from "bun:test";
import { RequestMagicLink } from "./RequestMagicLink";

function makeSubject(existingEmails: string[] = []) {
	const requests: { email: string; metadata?: Record<string, unknown>; name?: string }[] = [];
	const subject = new RequestMagicLink(
		{
			findUnique: async ({ where: { email } }) =>
				existingEmails.includes(email) ? { id: "user_1" } : null,
		},
		async request => {
			requests.push(request);
		},
	);

	return { requests, subject };
}

describe("RequestMagicLink", () => {
	it("sends an existing account a passwordless link", async () => {
		const { requests, subject } = makeSubject(["maria@example.com"]);

		await subject.execute({
			email: " Maria@Example.com ",
			metadata: { unitId: "boa-viagem" },
		});

		expect(requests).toEqual([
			{ email: "maria@example.com", metadata: { unitId: "boa-viagem" }, name: undefined },
		]);
	});

	it("sends a passwordless link for a new account", async () => {
		const { requests, subject } = makeSubject();

		await subject.execute({ email: "new@example.com" });

		expect(requests).toEqual([{ email: "new@example.com", metadata: undefined, name: "Cliente" }]);
	});
});
