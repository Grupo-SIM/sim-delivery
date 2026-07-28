import { createPermix } from "permix";
import type { Role } from "./roles";
import type { PermissionSchema } from "./schema";

/**
 * Builds the Permix instance for a given user, encoding the docs/03 matrix.
 *
 * `superAdmin` is the only cross-tenant role; all others are company-scoped (the
 * `companyId` filter is enforced by module guards, not here).
 */
export function createPermissions(role: Role) {
	const permix = createPermix<PermissionSchema>();

	const isSuper = role === "superAdmin";
	const isOwner = role === "owner";
	const isManager = role === "manager";
	const isAttendant = role === "attendant";
	const isKitchen = role === "kitchen";
	const isCourier = role === "courier";
	const isCustomer = role === "customer";

	// Company management (owner + up). "mgmt" = owner-equivalent operational access.
	const mgmt = isSuper || isOwner || isManager;
	// Anyone who works a store and may read catalog/units.
	const staffRead = mgmt || isAttendant || isKitchen;

	permix.setup({
		branding: {
			read: mgmt,
			update: isSuper || isOwner,
		},
		company: {
			create: isSuper,
			delete: isSuper,
			read: isSuper,
			update: isSuper,
		},
		coupons: {
			apply: mgmt || isAttendant,
			create: mgmt,
			delete: mgmt,
			read: mgmt,
			update: mgmt,
		},
		customers: {
			read: mgmt || isAttendant,
			update: mgmt,
		},
		deliveries: {
			assign: mgmt || isAttendant,
			read: mgmt || isCourier,
			updateStatus: mgmt || isCourier,
		},
		menu: {
			create: mgmt,
			delete: mgmt,
			read: staffRead || isCustomer,
			update: mgmt,
		},
		inventory: {
			create: mgmt,
			read: mgmt,
			update: mgmt,
		},
		orders: {
			create: mgmt || isAttendant || isCustomer,
			read: mgmt || isAttendant || isKitchen || isCourier || isCustomer,
			updateStatus: mgmt || isAttendant || isKitchen || isCourier,
		},
		reports: {
			read: mgmt,
		},
		reviews: {
			create: isCustomer,
			read: mgmt || isAttendant,
		},
		staff: {
			invite: mgmt,
			inviteOwner: isSuper || isOwner,
			read: mgmt,
			remove: mgmt,
			setRole: mgmt,
		},
		units: {
			create: mgmt,
			delete: mgmt,
			read: staffRead || isCustomer,
			update: mgmt,
		},
	});

	return permix;
}
