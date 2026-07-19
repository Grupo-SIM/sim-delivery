import { beforeEach, describe, expect, it, mock } from "bun:test";
import { slug } from "@/lib/variant";

interface SignInCall {
	credentials: { email: string; password: string };
	options: { query?: { slug?: string } } | undefined;
}

const signInCalls: SignInCall[] = [];
let signInError: { message: string } | null = null;
let sessionUser: Record<string, unknown> | null = null;
let signOutCount = 0;

mock.module("@/lib/auth-client", () => ({
	authClient: {
		getSession: async () => ({ data: sessionUser ? { user: sessionUser } : null }),
		signIn: {
			email: async (credentials: SignInCall["credentials"], options: SignInCall["options"]) => {
				signInCalls.push({ credentials, options });

				return { error: signInError };
			},
		},
		signOut: async () => {
			signOutCount += 1;
		},
	},
}));

const { isSuperAdmin, mapSessionUser, useAuthStore } = await import("./auth");

const initialState = {
	error: null,
	hydrated: false,
	isAuthenticated: false,
	isLoading: false,
	role: null,
	user: null,
};

const backendUser = {
	companyId: "cmp_1",
	createdAt: "2026-01-01T00:00:00Z",
	email: "maria@example.com",
	emailVerified: true,
	id: "user_1",
	image: null,
	name: "Maria",
	role: "owner",
};

describe("mapSessionUser", () => {
	it("maps the tenant fields from a session user", () => {
		expect(mapSessionUser(backendUser)).toMatchObject({
			companyId: "cmp_1",
			email: "maria@example.com",
			id: "user_1",
			role: "owner",
		});
	});

	it("defaults a user without a role to customer", () => {
		expect(mapSessionUser({ ...backendUser, role: null }).role).toBe("customer");
	});

	it("normalises missing companyId and image to null", () => {
		const { companyId, ...withoutCompany } = backendUser;
		const mapped = mapSessionUser({ ...withoutCompany, image: undefined });

		expect(mapped.companyId).toBeNull();
		expect(mapped.image).toBeNull();
	});
});

describe("isSuperAdmin", () => {
	it("recognises the platform operator", () => {
		expect(isSuperAdmin("superAdmin")).toBe(true);
	});

	it("rejects every other role", () => {
		for (const role of ["owner", "manager", "attendant", "kitchen", "courier", "customer"]) {
			expect(isSuperAdmin(role)).toBe(false);
		}
	});

	it("rejects an absent role", () => {
		expect(isSuperAdmin(null)).toBe(false);
		expect(isSuperAdmin(undefined)).toBe(false);
	});
});

describe("auth store", () => {
	beforeEach(() => {
		signInCalls.length = 0;
		signInError = null;
		sessionUser = null;
		signOutCount = 0;
		useAuthStore.setState(initialState);
	});

	it("marks the session hydrated and authenticated on setUser", () => {
		useAuthStore.getState().setUser(mapSessionUser(backendUser));

		expect(useAuthStore.getState()).toMatchObject({
			hydrated: true,
			isAuthenticated: true,
			role: "owner",
		});
	});

	it("hydrates as unauthenticated when there is no user", () => {
		useAuthStore.getState().setUser(null);

		expect(useAuthStore.getState()).toMatchObject({
			hydrated: true,
			isAuthenticated: false,
			role: null,
			user: null,
		});
	});

	it("clears a previous error on setUser", () => {
		useAuthStore.setState({ error: "Credenciais inválidas" });
		useAuthStore.getState().setUser(null);

		expect(useAuthStore.getState().error).toBeNull();
	});

	it("clears the error explicitly", () => {
		useAuthStore.setState({ error: "Credenciais inválidas" });
		useAuthStore.getState().clearError();

		expect(useAuthStore.getState().error).toBeNull();
	});

	it("signs in and stores the resulting session user", async () => {
		sessionUser = backendUser;

		await useAuthStore.getState().signIn({
			defaultUserName: "Usuário",
			email: "maria@example.com",
			invalidCredentialsMessage: "Credenciais inválidas",
			password: "s3nha",
		});

		expect(useAuthStore.getState()).toMatchObject({
			error: null,
			isAuthenticated: true,
			isLoading: false,
			role: "owner",
		});
	});

	it("surfaces the localized message when credentials are rejected", async () => {
		signInError = { message: "invalid" };

		await useAuthStore.getState().signIn({
			defaultUserName: "Usuário",
			email: "maria@example.com",
			invalidCredentialsMessage: "Credenciais inválidas",
			password: "errada",
		});

		expect(useAuthStore.getState()).toMatchObject({
			error: "Credenciais inválidas",
			isAuthenticated: false,
			isLoading: false,
			user: null,
		});
	});

	it("does not fetch the session when sign in failed", async () => {
		signInError = { message: "invalid" };
		sessionUser = backendUser;

		await useAuthStore.getState().signIn({
			defaultUserName: "Usuário",
			email: "maria@example.com",
			invalidCredentialsMessage: "Credenciais inválidas",
			password: "errada",
		});

		expect(useAuthStore.getState().user).toBeNull();
	});

	it("stays unauthenticated when the session comes back empty", async () => {
		sessionUser = null;

		await useAuthStore.getState().signIn({
			defaultUserName: "Usuário",
			email: "maria@example.com",
			invalidCredentialsMessage: "Credenciais inválidas",
			password: "s3nha",
		});

		expect(useAuthStore.getState()).toMatchObject({ isAuthenticated: false, role: null, user: null });
	});

	it("passes the build's company slug so the backend can scope the login", async () => {
		sessionUser = backendUser;

		await useAuthStore.getState().signIn({
			defaultUserName: "Usuário",
			email: "maria@example.com",
			invalidCredentialsMessage: "Credenciais inválidas",
			password: "s3nha",
		});

		// `slug` is baked in from VITE_COMPANY_SLUG; an unconfigured build must send no
		// query at all rather than an empty slug.
		expect(signInCalls[0].credentials).toEqual({ email: "maria@example.com", password: "s3nha" });
		expect(signInCalls[0].options?.query).toEqual(slug ? { slug } : undefined);
	});

	it("logs out and clears the session", async () => {
		useAuthStore.getState().setUser(mapSessionUser(backendUser));

		await useAuthStore.getState().logout();

		expect(signOutCount).toBe(1);
		expect(useAuthStore.getState()).toMatchObject({
			error: null,
			isAuthenticated: false,
			role: null,
			user: null,
		});
	});
});
