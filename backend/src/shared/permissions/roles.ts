/** Top-level access roles (docs/03). Stored on `user.role`. */
export const roles = ["superAdmin", "owner", "employee", "courier", "customer"] as const;
export type Role = (typeof roles)[number];

/** Employee sub-levels, used only when `role === "employee"`. Stored on `user.level`. */
export const employeeLevels = ["manager", "attendant", "kitchen"] as const;
export type EmployeeLevel = (typeof employeeLevels)[number];

export function isRole(value: unknown): value is Role {
	return typeof value === "string" && (roles as readonly string[]).includes(value);
}

export function isEmployeeLevel(value: unknown): value is EmployeeLevel {
	return typeof value === "string" && (employeeLevels as readonly string[]).includes(value);
}
