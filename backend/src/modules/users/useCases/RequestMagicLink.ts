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
 * Sends one passwordless entry link for every email. Better Auth creates the
 * account after verification when needed; its temporary name is replaced during
 * checkout before an order can be paid.
 */
export class RequestMagicLink {
	constructor(
		private readonly users: UserLookup,
		private readonly sendMagicLink: MagicLinkSender,
	) {}

	async execute(input: MagicLinkRequest): Promise<void> {
		const email = input.email.trim().toLowerCase();
		const exists = !!(await this.users.findUnique({ where: { email } }));

		await this.sendMagicLink({
			email,
			metadata: input.metadata,
			// User.name is non-null in our database. This placeholder also ensures the
			// checkout presents the full-name step before payment.
			name: exists ? undefined : "Cliente",
		});
	}
}
