import { create } from "zustand";

/** Access roles mirror the backend (docs/03). */
export type UserRole = "superAdmin" | "owner" | "employee" | "courier" | "customer";

export interface AuthUser {
	companyId: string | null;
	createdAt: number | string | Date;
	email: string;
	emailVerified: boolean;
	id: string;
	image: string | null;
	/** Employee sub-level when role = employee (docs/03). */
	level: string | null;
	name: string;
	role: string;
}

export interface AuthState {
	clearError: () => void;
	error: string | null;
	hydrated: boolean;
	isAuthenticated: boolean;
	isLoading: boolean;
	logout: () => void;
	role: string | null;
	setUser: (user: AuthUser | null) => void;
	signIn: (input: {
		defaultUserName: string;
		email: string;
		invalidCredentialsMessage: string;
		password: string;
	}) => Promise<void>;
	user: AuthUser | null;
}

export const useAuthStore = create<AuthState>(set => ({
	clearError: () => set({ error: null }),
	error: null,
	hydrated: false,
	isAuthenticated: false,
	isLoading: false,
	logout: () =>
		set({
			error: null,
			isAuthenticated: false,
			role: null,
			user: null,
		}),
	role: null,
	setUser: user =>
		set({
			error: null,
			hydrated: true,
			isAuthenticated: !!user,
			role: user?.role ?? null,
			user,
		}),
	signIn: async ({ defaultUserName, email, invalidCredentialsMessage, password }) => {
		set({ error: null, isLoading: true });
		await Promise.resolve();
		if (!email || password.length < 6) {
			set({ error: invalidCredentialsMessage, isLoading: false });
			return;
		}
		set({
			error: null,
			isAuthenticated: true,
			isLoading: false,
			role: "customer",
			user: {
				companyId: null,
				createdAt: new Date(),
				email,
				emailVerified: true,
				id: "demo-user",
				image: null,
				level: null,
				name: defaultUserName,
				role: "customer",
			},
		});
	},
	user: null,
}));

export function isSuperAdmin(role: string | null | undefined): boolean {
	return role === "superAdmin";
}
