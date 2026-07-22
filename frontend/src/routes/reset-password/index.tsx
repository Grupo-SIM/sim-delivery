import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Container } from "@/components/ui/Container";
import { Input } from "@/components/ui/input";
import { Label, RequiredMark } from "@/components/ui/label";
import { branding } from "@/lib/branding";

interface PasswordResetSearch {
	token: string;
}

function PasswordResetPage() {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const { token } = Route.useSearch();
	const [password, setPassword] = useState("");
	const [passwordConfirmation, setPasswordConfirmation] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [isPending, setIsPending] = useState(false);
	const [isSuccess, setIsSuccess] = useState(false);

	async function handleSubmit() {
		if (!token) {
			setError(t("auth.resetPassword.invalidToken"));
			return;
		}
		if (password.length < 6) {
			setError(t("auth.resetPassword.passwordTooShort"));
			return;
		}
		if (password !== passwordConfirmation) {
			setError(t("auth.resetPassword.passwordMismatch"));
			return;
		}

		setError(null);
		setIsPending(true);
		const response = await fetch(`${branding.apiUrl}/auth/reset-password`, {
			body: JSON.stringify({ newPassword: password, token }),
			headers: { "Content-Type": "application/json" },
			method: "POST",
		});
		setIsPending(false);

		if (!response.ok) {
			setError(t("auth.resetPassword.invalidToken"));
			return;
		}

		setIsSuccess(true);
	}

	return (
		<Container className="flex min-h-screen items-center justify-center py-10" size="sm">
			<Card className="w-full max-w-md">
				<CardHeader>
					<CardTitle>{t("auth.resetPassword.title")}</CardTitle>
					<CardDescription>{t("auth.resetPassword.subtitle")}</CardDescription>
				</CardHeader>
				<CardContent>
					{isSuccess ? (
						<div className="space-y-4">
							<p className="text-sm">{t("auth.resetPassword.success")}</p>
							<Button className="w-full" onClick={() => void navigate({ to: "/login" })} type="button">
								{t("auth.resetPassword.goToLogin")}
							</Button>
						</div>
					) : (
						<form
							className="space-y-4"
							onSubmit={event => {
								event.preventDefault();
								void handleSubmit();
							}}
						>
							<Label>
								<span>
									{t("auth.resetPassword.password")} <RequiredMark />
								</span>
								<Input
									onChange={event => setPassword(event.currentTarget.value)}
									placeholder={t("auth.resetPassword.passwordPlaceholder")}
									required
									type="password"
									value={password}
								/>
							</Label>
							<Label>
								<span>
									{t("auth.resetPassword.passwordConfirmation")} <RequiredMark />
								</span>
								<Input
									onChange={event => setPasswordConfirmation(event.currentTarget.value)}
									placeholder={t("auth.resetPassword.passwordPlaceholder")}
									required
									type="password"
									value={passwordConfirmation}
								/>
							</Label>

							{error && <p className="text-destructive text-sm">{error}</p>}

							<Button className="w-full" disabled={isPending} type="submit">
								{isPending ? t("auth.resetPassword.submitting") : t("auth.resetPassword.submit")}
							</Button>
						</form>
					)}
				</CardContent>
			</Card>
		</Container>
	);
}

export const Route = createFileRoute("/reset-password/")({
	component: PasswordResetPage,
	validateSearch: (search: Record<string, unknown>): PasswordResetSearch => ({ token: String(search.token ?? "") }),
});
