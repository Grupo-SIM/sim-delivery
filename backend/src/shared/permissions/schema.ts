/**
 * The platform-wide permission schema. Every module's actions live here so a single
 * `createPermissions(role, level)` (see ./createPermissions) resolves the whole matrix
 * (docs/03). Module guards call `permix.check("<resource>", "<action>")`.
 */
import type { PermixDefinition } from "permix";

export interface PermissionSchema extends PermixDefinition {
	company: { action: "read" | "create" | "update" | "delete" };
	units: { action: "read" | "create" | "update" | "delete" };
	unitWhatsApp: { action: "read" | "manage" };
	menu: { action: "read" | "create" | "update" | "updateAvailability" | "delete" };
	orders: { action: "read" | "create" | "print" | "updateStatus" };
	customers: { action: "read" | "update" };
	staff: { action: "read" | "invite" | "inviteOwner" | "setRole" | "assignOperational" | "remove" };
	deliveries: { action: "read" | "assign" | "updateStatus" };
	coupons: { action: "read" | "create" | "update" | "delete" | "apply" };
	inventory: { action: "read" | "create" | "update" };
	reports: { action: "dashboard" | "read" };
	receiptTemplate: { action: "read" | "update" };
	reviews: { action: "read" | "create" };
	branding: { action: "read" | "update" };
	withdrawals: { action: "read" | "request" | "configure" };
}
