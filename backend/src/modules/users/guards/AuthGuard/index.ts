import { DomainError } from "@/shared/errors";
import { auth } from "@/shared/infra/betterAuth";
import { UserErrors } from "../../errors";
import type { AuthGuardReturn } from "./types";

export abstract class AuthGuard {
	static async execute(headers: Headers): Promise<AuthGuardReturn> {
		const session = await auth.api.getSession({ headers });
		if (!session) {
			throw new DomainError(UserErrors.WRONG_CREDENTIALS);
		}

		return {
			sessionToken: session.session.token,
			userId: session.user.id,
		};
	}
}
