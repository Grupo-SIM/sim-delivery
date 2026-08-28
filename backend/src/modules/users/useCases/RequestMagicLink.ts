import { DomainError } from "@/shared/errors";
import { UserErrors } from "../errors";

export type MagicLinkIntent = "sign-in" | "sign-up";

interface UserLookup {
	findUnique(input: { where: { email: string } }): Promise<{ id: string } | null>;
}

interface MagicLinkRequest {
	email: string;
	metadata?: Record<string, unknown>;
	name?: string;
}

type MagicLinkSender = (request: MagicLinkRequest) => Promise<unknown>;

/**
 * Makes account creation explicit while retaining passwordless access. Better Auth
 * only creates a magic-link user after verification, so the name must accompany
 * the first link request instead of being collected after the account exists.
 */
export class RequestMagicLink {
	constructor(
		private readonly users: UserLookup,
		private readonly sendMagicLink: MagicLinkSender,
	) {}

	async execute(input: MagicLinkRequest & { intent: MagicLinkIntent }): Promise<void> {
		const email = input.email.trim().toLowerCase();
		const exists = !!(await this.users.findUnique({ where: { email } }));

		if (input.intent === "sign-in" && !exists) throw new DomainError(UserErrors.ACCOUNT_NOT_FOUND);
		if (input.intent === "sign-up" && exists) throw new DomainError(UserErrors.ACCOUNT_ALREADY_EXISTS);

		await this.sendMagicLink({
			email,
			metadata: input.metadata,
			name: input.intent === "sign-up" ? input.name?.trim() : undefined,
		});
	}
}
