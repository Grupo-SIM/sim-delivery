import { DomainError } from "@/shared/errors";
import { auth } from "@/shared/infra/betterAuth";
import { createPermissions, isEmployeeLevel, isRole, type PermissionSchema } from "@/shared/permissions";
import { UserErrors } from "../../errors";
import type { CompanyScopeReturn } from "./types";

/**
 * Resolves the authenticated user's tenant + RBAC context from the Better Auth session
 * (docs/03). Every company-scoped controller derives this once and passes `companyId`
 * to its use-cases so no data crosses tenants (superAdmin is the only null-company role).
 */
export abstract class CompanyScopeGuard {
	static async execute(headers: Headers): Promise<CompanyScopeReturn> {
		const session = await auth.api.getSession({ headers });
		if (!session) {
			throw new DomainError(UserErrors.WRONG_CREDENTIALS);
		}

		const { companyId, id: userId, level, role } = session.user;

		return {
			companyId: companyId ?? null,
			level: isEmployeeLevel(level) ? level : null,
			role: isRole(role) ? role : "customer",
			userId,
		};
	}

	/** Throws FORBIDDEN unless the user's role/level permits `action` on `resource`. */
	static authorize<Resource extends keyof PermissionSchema>(
		scope: CompanyScopeReturn,
		resource: Resource,
		action: PermissionSchema[Resource]["action"],
	): void {
		const permix = createPermissions(scope.role, scope.level);
		// Permix's CheckFunctionParams is a per-key conditional tuple that TS cannot
		// collapse under the generic `Resource`, so we narrow the call here — the public
		// signature above keeps callers fully typed.
		const check = permix.check as (
			resource: Resource,
			action: PermissionSchema[Resource]["action"],
		) => boolean;
		if (!check(resource, action)) {
			throw new DomainError(UserErrors.FORBIDDEN);
		}
	}
}
