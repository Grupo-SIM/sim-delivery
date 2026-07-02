import { create } from "zustand";
import { authClient } from "@/lib/auth-client";

/** Access roles mirror the backend (docs/03). */
export type UserRole = "superAdmin" | "owner" | "employee" | "courier" | "customer";

type SessionUser = {
	companyId?: string | null;
	createdAt: number | string | Date;
	email: string;
	emailVerified: boolean;
	id: string;
	image?: string | null;
	level?: string | null;
	name: string;
	role?: string | null;
};

/** Maps a Better Auth session user (with tenant additionalFields) to the store shape. */
export function mapSessionUser(user: SessionUser): AuthUser {
	return {
		companyId: user.companyId ?? null,
		createdAt: user.createdAt,
		email: user.email,
		emailVerified: user.emailVerified,
		id: user.id,
		image: user.image ?? null,
		level: user.level ?? null,
		name: user.name,
		role: user.role ?? "customer",
	};
}

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
	logout: () => Promise<void>;
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
	logout: async () => {
		await authClient.signOut();
		set({
			error: null,
			isAuthenticated: false,
			role: null,
			user: null,
		});
	},
	role: null,
	setUser: user =>
		set({
			error: null,
			hydrated: true,
			isAuthenticated: !!user,
			role: user?.role ?? null,
			user,
		}),
	signIn: async ({ email, invalidCredentialsMessage, password }) => {
		set({ error: null, isLoading: true });

		const { error } = await authClient.signIn.email({ email, password });
		if (error) {
			set({ error: invalidCredentialsMessage, isLoading: false });
			return;
		}

		const session = await authClient.getSession();
		const user = session.data?.user ? mapSessionUser(session.data.user) : null;
		set({
			error: null,
			hydrated: true,
			isAuthenticated: !!user,
			isLoading: false,
			role: user?.role ?? null,
			user,
		});
	},
	user: null,
}));

export function isSuperAdmin(role: string | null | undefined): boolean {
	return role === "superAdmin";
}
