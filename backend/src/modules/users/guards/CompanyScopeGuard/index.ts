import { DomainError } from "@/shared/errors";
import { auth } from "@/shared/infra/betterAuth";
import { prisma } from "@/shared/infra/sql";
import { createPermissions, isRole, type PermissionSchema } from "@/shared/permissions";
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

		const slug = process.env.COMPANY_SLUG?.trim();
		if (!slug) {
			throw new DomainError(UserErrors.FORBIDDEN);
		}

		const [company, user] = await Promise.all([
			prisma.company.findUnique({ select: { id: true }, where: { slug } }),
			prisma.user.findUnique({
				select: { companyId: true, role: true, staffUnits: { select: { unitId: true } } },
				where: { id: session.user.id },
			}),
		]);

		if (!company || !user || !isRole(user.role)) {
			throw new DomainError(UserErrors.FORBIDDEN);
		}

		if (user.role !== "superAdmin" && user.companyId !== company.id) {
			throw new DomainError(UserErrors.FORBIDDEN);
		}

		return {
			companyId: company.id,
			role: user.role,
			unitIds: user.staffUnits.map(({ unitId }) => unitId),
			userId: session.user.id,
		};
	}

	/** Throws FORBIDDEN unless the user's role permits `action` on `resource`. */
	static authorize<Resource extends keyof PermissionSchema>(
		scope: CompanyScopeReturn,
		resource: Resource,
		action: PermissionSchema[Resource]["action"],
	): void {
		const permix = createPermissions(scope.role);
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

	/** Blocks staff from reading or mutating a unit they were not explicitly assigned. */
	static authorizeUnit(scope: CompanyScopeReturn, unitId: string): void {
		if (!["owner", "superAdmin"].includes(scope.role) && !scope.unitIds.includes(unitId)) {
			throw new DomainError(UserErrors.FORBIDDEN);
		}
	}

	static authorizeUnits(scope: CompanyScopeReturn, unitIds: string[]): void {
		for (const unitId of unitIds) this.authorizeUnit(scope, unitId);
	}

	/** Non-owner staff is always restricted to explicitly assigned units. */
	static permittedUnitIds(scope: CompanyScopeReturn): string[] | undefined {
		return ["owner", "superAdmin"].includes(scope.role) ? undefined : scope.unitIds;
	}
}
