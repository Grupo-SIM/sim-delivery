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

	if (isSuper) {
		permix.setup({
			branding: { read: true, update: true },
			company: { create: true, delete: true, read: true, update: true },
			coupons: { apply: true, create: true, delete: true, read: true, update: true },
			customers: { read: true, update: true },
			deliveries: { assign: true, read: true, updateStatus: true },
			inventory: { create: true, read: true, update: true },
			menu: { create: true, delete: true, read: true, update: true },
			orders: { create: true, read: true, updateStatus: true },
			reports: { read: true },
			reviews: { create: true, read: true },
			staff: { invite: true, inviteOwner: true, read: true, remove: true, setRole: true },
			units: { create: true, delete: true, read: true, update: true },
		});
		return permix;
	}

	// Company management (owner + manager). "mgmt" = operational management access.
	const mgmt = isOwner || isManager;
	// Anyone who works a store and may read catalog/units.
	const staffRead = mgmt || isAttendant || isKitchen;

	permix.setup({
		branding: {
			read: mgmt,
			update: isOwner,
		},
		company: {
			create: false,
			delete: false,
			read: false,
			update: false,
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
			inviteOwner: isOwner,
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
