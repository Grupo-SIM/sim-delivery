import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Container } from "@/components/ui/Container";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthStore } from "@/stores";

function LoginPage() {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const { clearError, error, isLoading, signIn } = useAuthStore();
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");

	return (
		<Container className="flex min-h-screen items-center justify-center py-10" size="sm">
			<Card className="w-full max-w-md">
				<CardHeader>
					<CardTitle>{t("auth.login.title")}</CardTitle>
					<CardDescription>{t("auth.login.subtitle")}</CardDescription>
				</CardHeader>
				<CardContent>
					<form
						className="space-y-4"
						onSubmit={async event => {
							event.preventDefault();
							await signIn({
								defaultUserName: email,
								email,
								invalidCredentialsMessage: t("auth.errors.invalidCredentials"),
								password,
							});
							if (useAuthStore.getState().isAuthenticated) {
								await navigate({ to: "/" });
							}
						}}
					>
						<Label>
							{t("auth.login.email")}
							<Input
								onChange={event => {
									setEmail(event.currentTarget.value);
									clearError();
								}}
								placeholder={t("auth.login.emailPlaceholder")}
								required
								type="email"
								value={email}
							/>
						</Label>
						<Label>
							{t("auth.login.password")}
							<Input
								onChange={event => {
									setPassword(event.currentTarget.value);
									clearError();
								}}
								required
								type="password"
								value={password}
							/>
						</Label>

						{error && <Alert>{error}</Alert>}

						<Button className="w-full" disabled={isLoading} type="submit">
							{isLoading ? t("auth.login.submitting") : t("auth.login.submit")}
						</Button>
					</form>
				</CardContent>
			</Card>
		</Container>
	);
}

export const Route = createFileRoute("/login/")({
	component: LoginPage,
});
