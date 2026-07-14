/**
 * The platform-wide permission schema. Every module's actions live here so a single
 * `createPermissions(role, level)` (see ./createPermissions) resolves the whole matrix
 * (docs/03). Module guards call `permix.check("<resource>", "<action>")`.
 */
import type { PermixDefinition } from "permix";

export interface PermissionSchema extends PermixDefinition {
	company: { action: "read" | "create" | "update" | "delete" };
	units: { action: "read" | "create" | "update" | "delete" };
	menu: { action: "read" | "create" | "update" | "delete" };
	orders: { action: "read" | "create" | "updateStatus" };
	customers: { action: "read" | "update" };
	staff: { action: "read" | "invite" | "setRole" | "remove" };
	deliveries: { action: "read" | "assign" | "updateStatus" };
	coupons: { action: "read" | "create" | "apply" };
	reports: { action: "read" };
	reviews: { action: "read" | "create" };
	branding: { action: "read" | "update" };
}
