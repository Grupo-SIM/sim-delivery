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
	it("sends an existing account a passwordless sign-in link", async () => {
		const { requests, subject } = makeSubject(["maria@example.com"]);

		await subject.execute({
			email: " Maria@Example.com ",
			intent: "sign-in",
			metadata: { unitId: "boa-viagem" },
		});

		expect(requests).toEqual([
			{ email: "maria@example.com", metadata: { unitId: "boa-viagem" }, name: undefined },
		]);
	});

	it("does not claim to sign in an account that does not exist", async () => {
		const { requests, subject } = makeSubject();

		await expect(subject.execute({ email: "new@example.com", intent: "sign-in" })).rejects.toThrow(
			"ACCOUNT_NOT_FOUND",
		);
		expect(requests).toHaveLength(0);
	});

	it("starts a new account with its name and email", async () => {
		const { requests, subject } = makeSubject();

		await subject.execute({ email: "new@example.com", intent: "sign-up", name: "  Maria Silva  " });

		expect(requests).toEqual([{ email: "new@example.com", metadata: undefined, name: "Maria Silva" }]);
	});

	it("does not send a registration link for an email already in use", async () => {
		const { requests, subject } = makeSubject(["maria@example.com"]);

		await expect(
			subject.execute({ email: "maria@example.com", intent: "sign-up", name: "Maria" }),
		).rejects.toThrow("ACCOUNT_ALREADY_EXISTS");
		expect(requests).toHaveLength(0);
	});
});
