import { create } from "zustand";

export type UserRole = "USER" | "ADMIN";
export type KycStatus = "NOT_SUBMITTED" | "SUBMITTED" | "APPROVED" | "REJECTED";

export interface AuthUser {
	createdAt: number | string | Date;
	document: string | null;
	email: string;
	emailVerified: boolean;
	id: string;
	image: string | null;
	kycStatus: string;
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
			role: "USER",
			user: {
				createdAt: new Date(),
				document: null,
				email,
				emailVerified: true,
				id: "demo-user",
				image: null,
				kycStatus: "NOT_SUBMITTED",
				name: defaultUserName,
				role: "USER",
			},
		});
	},
	user: null,
}));

export function isAdmin(role: string | null | undefined): boolean {
	return role === "ADMIN";
}
