/** Staff roles that are scoped to their own company (superAdmin and customer are not). */
const STAFF_ROLES = ["owner", "manager", "attendant", "kitchen", "courier"];

/**
 * Decides the per-session tenant/role override for a site-scoped login (docs/03): a
 * superAdmin session gets scoped to the requested site; a staff member signing into a
 * site that isn't their own is downgraded to "customer" for that session only. Returns
 * `undefined` when no override applies (normal same-company staff, customers, or no
 * requested site at all), meaning the session keeps using the user's own companyId/role.
 */
export function resolveSiteSessionOverride(
	requestedCompanyId: string | undefined,
	user: { companyId: string | null; role: string },
): { companyId: string; role: string } | undefined {
	if (!requestedCompanyId) {
		return undefined;
	}

	if (user.role === "superAdmin") {
		return { companyId: requestedCompanyId, role: "superAdmin" };
	}

	if (STAFF_ROLES.includes(user.role) && user.companyId !== requestedCompanyId) {
		return { companyId: requestedCompanyId, role: "customer" };
	}

	return undefined;
}
