import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ProfileSecurityFormProps {
	isSaving: boolean;
	onSave: (value: { confirmPassword: string; currentPassword: string; password: string }) => void;
}

export function ProfileSecurityForm({ isSaving, onSave }: ProfileSecurityFormProps) {
	const { t } = useTranslation();
	const [currentPassword, setCurrentPassword] = useState("");
	const [password, setPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const dirty = Boolean(currentPassword || password || confirmPassword);

	return (
		<section className="space-y-4 rounded-xl border border-border bg-card text-card-foreground p-5">
			<h2 className="font-semibold text-lg">{t("store.account.profile.security")}</h2>
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
					onChange={event => setPassword(event.currentTarget.value)}
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
			<Button
				disabled={!dirty || isSaving}
				onClick={() => onSave({ confirmPassword, currentPassword, password })}
				type="button"
			>
				{isSaving ? t("store.account.profile.passwordSaving") : t("store.account.profile.passwordSave")}
			</Button>
		</section>
	);
}
