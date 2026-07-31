import { create } from "zustand";
import { authClient } from "@/lib/auth-client";
import { slug } from "@/lib/variant";

/** Access roles mirror the backend (docs/03). */
export type UserRole = "superAdmin" | "owner" | "manager" | "attendant" | "kitchen" | "courier" | "customer";

interface SessionUser {
	companyId?: string | null;
	createdAt: number | string | Date;
	email: string;
	emailVerified: boolean;
	id: string;
	image?: string | null;
	name: string;
	phoneNumber?: string | null;
	phoneNumberVerified?: boolean | null;
	role?: string | null;
	themePreference?: string | null;
}

/** Maps a Better Auth session user (with tenant additionalFields) to the store shape. */
export function mapSessionUser(sessionUser: unknown): AuthUser {
	const user = sessionUser as SessionUser;
	return {
		companyId: user.companyId ?? null,
		createdAt: user.createdAt,
		email: user.email,
		emailVerified: user.emailVerified,
		id: user.id,
		image: user.image ?? null,
		name: user.name,
		phoneNumber: user.phoneNumber ?? null,
		phoneNumberVerified: user.phoneNumberVerified ?? false,
		role: user.role ?? "customer",
		themePreference:
			user.themePreference === "dark" || user.themePreference === "light" ? user.themePreference : null,
	};
}

export interface AuthUser {
	companyId: string | null;
	createdAt: number | string | Date;
	email: string;
	emailVerified: boolean;
	id: string;
	image: string | null;
	name: string;
	phoneNumber: string | null;
	phoneNumberVerified: boolean;
	role: string;
	themePreference: "dark" | "light" | null;
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

		// Sends this build's slug (docs/02) so the backend can scope superAdmin to
		// this site, or downgrade staff signing into a site that isn't their own (docs/03).
		const { error } = await authClient.signIn.email(
			{ email, password },
			{ query: slug ? { slug } : undefined },
		);
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
