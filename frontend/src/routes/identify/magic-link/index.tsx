import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Container } from "@/components/ui/Container";
import { authClient } from "@/lib/auth-client";

interface MagicLinkSearch {
	token: string;
	unitId?: string;
}

function MagicLinkVerifyPage() {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const { token, unitId } = Route.useSearch();
	const [error, setError] = useState(false);

	useEffect(() => {
		let cancelled = false;

		void authClient.magicLink.verify({ query: { token } }).then(({ error: caught }) => {
			if (cancelled) return;
			if (caught) {
				setError(true);
				return;
			}
			void navigate({ params: { unitId: unitId ?? "" }, to: unitId ? "/$unitId/checkout" : "/" });
		});

		return () => {
			cancelled = true;
		};
	}, [token, unitId, navigate]);

	return (
		<Container className="flex min-h-screen items-center justify-center py-10" size="sm">
			<p className="text-muted-foreground text-sm">
				{error ? t("store.checkout.identify.errors.magicLink") : t("store.checkout.identify.verifying")}
			</p>
		</Container>
	);
}

export const Route = createFileRoute("/identify/magic-link/")({
	component: MagicLinkVerifyPage,
	validateSearch: (search: Record<string, unknown>): MagicLinkSearch => ({
		token: String(search.token ?? ""),
		unitId: search.unitId ? String(search.unitId) : undefined,
	}),
});
