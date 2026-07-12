/** Top-level access roles (docs/03). Stored on `user.role`. */
export const roles = ["superAdmin", "owner", "manager", "attendant", "kitchen", "courier", "customer"] as const;
export type Role = (typeof roles)[number];

export function isRole(value: unknown): value is Role {
	return typeof value === "string" && (roles as readonly string[]).includes(value);
}
