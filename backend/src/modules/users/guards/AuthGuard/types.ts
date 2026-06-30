import { t } from "elysia";

export const AuthGuardReturn = t.Object({
	sessionToken: t.String(),
	userId: t.String(),
});
export type AuthGuardReturn = typeof AuthGuardReturn.static;
