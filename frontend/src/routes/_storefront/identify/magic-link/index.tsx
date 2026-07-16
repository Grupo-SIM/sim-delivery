import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Container } from "@/components/ui/Container";
import { authClient } from "@/lib/auth-client";
import { mapSessionUser, useAuthStore } from "@/stores/auth";

interface MagicLinkSearch {
	token: string;
	unitId?: string;
}

function MagicLinkVerifyPage() {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const setUser = useAuthStore(state => state.setUser);
	const { token, unitId } = Route.useSearch();
	const [error, setError] = useState(false);
	// Magic link tokens are single-use server-side; StrictMode's double effect invocation
	// in dev would otherwise fire verify() twice, failing the second call. Cache the request
	// promise per token so both invocations await the same in-flight verification.
	const verifyPromiseRef = useRef(new Map<string, Promise<{ error: unknown }>>());

	useEffect(() => {
		let cancelled = false;

		let promise = verifyPromiseRef.current.get(token);
		if (!promise) {
			promise = authClient.magicLink.verify({ query: { token } });
			verifyPromiseRef.current.set(token, promise);
		}

		void promise.then(async ({ error: caught }) => {
			if (cancelled) return;
			if (caught) {
				setError(true);
				return;
			}

			const session = await authClient.getSession();
			if (cancelled) return;
			if (!session.data?.user) {
				setError(true);
				return;
			}

			setUser(mapSessionUser(session.data.user));
			void navigate({ params: { unitId: unitId ?? "" }, to: unitId ? "/$unitId/checkout" : "/" });
		});

		return () => {
			cancelled = true;
		};
	}, [token, unitId, navigate, setUser]);

	return (
		<Container className="flex min-h-screen items-center justify-center py-10" size="sm">
			<p className="text-muted-foreground text-sm">
				{error ? t("store.checkout.identify.errors.magicLink") : t("store.checkout.identify.verifying")}
			</p>
		</Container>
	);
}

export const Route = createFileRoute("/_storefront/identify/magic-link/")({
	component: MagicLinkVerifyPage,
	validateSearch: (search: Record<string, unknown>): MagicLinkSearch => ({
		token: String(search.token ?? ""),
		unitId: search.unitId ? String(search.unitId) : undefined,
	}),
});
