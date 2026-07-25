import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/Container";
import { Input } from "@/components/ui/input";
import { Label, RequiredMark } from "@/components/ui/label";
import { MaskedInput } from "@/components/ui/MaskedInput";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Skeleton } from "@/components/ui/Skeleton";
import { useDebouncedInput } from "@/hooks/use-debounced-input";
import { useGetCustomersMe } from "@/lib/api";
import { authClient } from "@/lib/auth-client";
import { branding } from "@/lib/branding";
import { slug } from "@/lib/variant";
import { mapSessionUser, useAuthStore } from "@/stores/auth";

function initials(name: string): string {
	const parts = name.trim().split(/\s+/).filter(Boolean);
	if (parts.length === 0) return "?";
	if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
	return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function ProfilePage() {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const hydrated = useAuthStore(state => state.hydrated);
	const isAuthenticated = useAuthStore(state => state.isAuthenticated);
	const user = useAuthStore(state => state.user);
	const setUser = useAuthStore(state => state.setUser);
	const customerQuery = useGetCustomersMe(
		{ slug: slug ?? "" },
		{ query: { enabled: isAuthenticated && !!slug } },
	);

	const [name, setName] = useState(user?.name ?? "");
	const [localName, setLocalName, flushName] = useDebouncedInput(name, setName);
	const [saving, setSaving] = useState(false);
	const [saved, setSaved] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [password, setPassword] = useState("");
	const [currentPassword, setCurrentPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [phone, setPhone] = useState(user?.phoneNumber ?? "");

	useEffect(() => {
		if (!user) return;
		setName(user.name);
		setPhone(user.phoneNumber ?? "");
	}, [user]);

	useEffect(() => {
		if (customerQuery.data?.phone) setPhone(customerQuery.data.phone);
	}, [customerQuery.data?.phone]);

	useEffect(() => {
		if (hydrated && !isAuthenticated) void navigate({ to: "/identify" });
	}, [hydrated, isAuthenticated, navigate]);

	if (!hydrated || (isAuthenticated && !user)) {
		return (
			<Container className="max-w-xl space-y-6 py-8">
				<div className="space-y-2">
					<Skeleton className="h-8 w-56" />
					<Skeleton className="h-4 w-80 max-w-full" />
				</div>
				<Skeleton className="h-28 w-full" />
				<Skeleton className="h-64 w-full" />
			</Container>
		);
	}

	if (!user) return null;

	const trimmedName = localName.trim();
	const hasPasswordUpdate = Boolean(currentPassword || password || confirmPassword);
	const dirty =
		(trimmedName.length > 0 && trimmedName !== user.name) ||
		phone.replace(/\D/g, "").length === 13 ||
		hasPasswordUpdate;

	async function handleSave() {
		flushName();
		setError(null);
		setSaved(false);
		setSaving(true);
		if (hasPasswordUpdate && (!password || password !== confirmPassword)) {
			setError(t("store.account.profile.passwordMismatch"));
			setSaving(false);
			return;
		}
		const { error: caught } = await authClient.updateUser({ name: trimmedName });
		if (caught) {
			setError(t("store.account.profile.saveError"));
			setSaving(false);
			return;
		}
		const phoneDigits = phone.replace(/\D/g, "");
		if (phoneDigits.length === 13) {
			const phoneResponse = await fetch(`${branding.apiUrl}/customers/me/phone`, {
				body: JSON.stringify({ phone: phoneDigits }),
				credentials: "include",
				headers: { "Content-Type": "application/json" },
				method: "PATCH",
			});
			if (!phoneResponse.ok) {
				setError(t("store.account.profile.saveError"));
				setSaving(false);
				return;
			}
		}
		if (hasPasswordUpdate) {
			const passwordResponse = await fetch(`${branding.apiUrl}/auth/set-password`, {
				body: JSON.stringify({ currentPassword: currentPassword || null, newPassword: password }),
				credentials: "include",
				headers: { "Content-Type": "application/json" },
				method: "POST",
			});
			if (!passwordResponse.ok) {
				setError(t("store.account.profile.passwordSaveError"));
				setSaving(false);
				return;
			}
			setCurrentPassword("");
			setPassword("");
			setConfirmPassword("");
		}
		const session = await authClient.getSession();
		if (session.data?.user) setUser(mapSessionUser(session.data.user));
		setSaving(false);
		setSaved(true);
	}

	return (
		<Container className="max-w-xl space-y-6 py-8">
			<SectionHeading
				subtitle={t("store.account.profile.subtitle")}
				title={t("store.account.profile.title")}
			/>

			<div className="flex items-center gap-4 rounded-xl border border-border bg-card p-5">
				{user.image ? (
					<img alt="" className="h-16 w-16 rounded-full object-cover" src={user.image} />
				) : (
					<span className="grid h-16 w-16 place-items-center rounded-full bg-primary font-semibold text-lg text-primary-foreground">
						{initials(user.name)}
					</span>
				)}
				<div className="min-w-0">
					<p className="truncate font-semibold">{user.name}</p>
					<p className="truncate text-muted-foreground text-sm">{user.email}</p>
				</div>
			</div>

			<div className="space-y-4 rounded-xl border border-border bg-card p-5">
				<Label>
					<span>
						{t("store.account.profile.name")} <RequiredMark />
					</span>
					<Input
						onChange={event => setLocalName(event.currentTarget.value)}
						placeholder={t("store.account.profile.namePlaceholder")}
						value={localName}
					/>
				</Label>
				<Label>
					{t("store.account.profile.email")}
					<Input disabled placeholder="cliente@email.com" readOnly value={user.email} />
				</Label>
				<p className="text-muted-foreground text-xs">{t("store.account.profile.emailHint")}</p>
				<Label>
					{t("store.account.profile.phone")}
					<MaskedInput
						format="+55 (##) #####-####"
						inputMode="tel"
						mask="_"
						onValueChange={({ value }) => setPhone(value)}
						placeholder={t("store.account.profile.phonePlaceholder")}
						value={phone.replace(/^\+/, "")}
					/>
				</Label>

				<div className="space-y-3 border-border border-t pt-4">
					<Label>
						{t("store.account.profile.currentPassword")}
						<Input
							autoComplete="current-password"
							onChange={event => setCurrentPassword(event.currentTarget.value)}
							placeholder={t("store.account.profile.currentPasswordPlaceholder")}
							type="password"
							value={currentPassword}
						/>
					</Label>
					<Label>
						{t("store.account.profile.password")}
						<Input
							autoComplete="new-password"
							onChange={event => {
								setPassword(event.currentTarget.value);
							}}
							placeholder={t("store.account.profile.passwordPlaceholder")}
							type="password"
							value={password}
						/>
					</Label>
					<Label>
						{t("store.account.profile.confirmPassword")}
						<Input
							autoComplete="new-password"
							onChange={event => setConfirmPassword(event.currentTarget.value)}
							placeholder={t("store.account.profile.confirmPasswordPlaceholder")}
							type="password"
							value={confirmPassword}
						/>
					</Label>
					<p className="text-muted-foreground text-xs">{t("store.account.profile.passwordHint")}</p>
				</div>

				{error && <p className="text-destructive text-sm">{error}</p>}
				{saved && <p className="text-primary text-sm">{t("store.account.profile.saved")}</p>}

				<div className="flex items-center gap-3">
					<Button disabled={!dirty || saving} onClick={handleSave} type="button">
						{saving ? t("store.account.profile.saving") : t("store.account.profile.save")}
					</Button>
					<Link className="text-muted-foreground text-sm underline" to="/orders">
						{t("store.account.myOrders")}
					</Link>
				</div>
			</div>
		</Container>
	);
}

export const Route = createFileRoute("/_storefront/profile/")({
	component: ProfilePage,
});
