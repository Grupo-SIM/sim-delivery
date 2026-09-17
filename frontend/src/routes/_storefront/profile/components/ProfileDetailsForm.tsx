import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label, RequiredMark } from "@/components/ui/label";
import { MaskedInput } from "@/components/ui/MaskedInput";

import { getBrazilianMobileDigits, toBrazilianMobilePhone } from "@/lib/brazilian-phone";
import { isValidCpf } from "@/lib/cpf";
import type { AuthUser } from "@/stores/auth";

interface ProfileDetailsFormProps {
	customer: { cpf: string | null; phone: string | null } | null;
	isSaving: boolean;
	onSave: (value: { cpf: string; email: string; name: string; phone: string }) => void;
	user: AuthUser;
}

export function ProfileDetailsForm({ customer, isSaving, onSave, user }: ProfileDetailsFormProps) {
	const { t } = useTranslation();
	const [name, setName] = useState(user.name);
	const hasTemporaryPhoneEmail = user.email.endsWith("@phone.local");
	const [email, setEmail] = useState(hasTemporaryPhoneEmail ? "" : user.email);
	const [phone, setPhone] = useState(getBrazilianMobileDigits(customer?.phone));
	const [cpf, setCpf] = useState(customer?.cpf ?? "");

	useEffect(() => setName(user.name), [user.name]);
	useEffect(() => setEmail(hasTemporaryPhoneEmail ? "" : user.email), [hasTemporaryPhoneEmail, user.email]);
	useEffect(() => {
		setPhone(getBrazilianMobileDigits(customer?.phone));
		setCpf(customer?.cpf ?? "");
	}, [customer?.cpf, customer?.phone]);

	const trimmedName = name.trim();
	const trimmedEmail = email.trim();
	const phoneDigits = getBrazilianMobileDigits(phone);
	const normalizedPhone = toBrazilianMobilePhone(phoneDigits);
	const cpfDigits = cpf.replace(/\D/g, "");
	const dirty =
		trimmedName !== user.name ||
		(hasTemporaryPhoneEmail && Boolean(trimmedEmail)) ||
		normalizedPhone !== toBrazilianMobilePhone(customer?.phone) ||
		cpfDigits !== (customer?.cpf ?? "");
	const validPhone = phoneDigits.length === 11;
	const validCpf = isValidCpf(cpfDigits);

	return (
		<form
			className="space-y-4 rounded-xl border border-border bg-card p-5"
			onSubmit={event => {
				event.preventDefault();
				onSave({ cpf: cpfDigits, email: trimmedEmail, name: trimmedName, phone: normalizedPhone });
			}}
		>
			<h2 className="font-semibold text-lg">{t("store.account.profile.personalData")}</h2>
			<Label>
				<span>
					{t("store.account.profile.name")} <RequiredMark />
				</span>
				<Input
					autoComplete="name"
					name="name"
					onChange={event => setName(event.currentTarget.value)}
					placeholder={t("store.account.profile.namePlaceholder")}
					required
					value={name}
				/>
			</Label>
			<Label>
				{t("store.account.profile.email")}
				<Input
					autoComplete="email"
					disabled={!hasTemporaryPhoneEmail}
					name="email"
					onChange={event => setEmail(event.currentTarget.value)}
					placeholder={hasTemporaryPhoneEmail ? t("store.account.profile.emailPlaceholder") : undefined}
					readOnly={!hasTemporaryPhoneEmail}
					type="email"
					value={email}
				/>
			</Label>
			<p className="text-muted-foreground text-xs">
				{t(`store.account.profile.${hasTemporaryPhoneEmail ? "emailInitialHint" : "emailHint"}`)}
			</p>
			<div className="grid gap-4 sm:grid-cols-2">
				<Label>
					<span>
						{t("store.account.profile.phone")} <RequiredMark />
					</span>
					<MaskedInput
						autoComplete="tel"
						format="+55 (##) #####-####"
						inputMode="tel"
						mask="_"
						name="phone"
						onValueChange={({ value }) => setPhone(value)}
						placeholder={t("store.account.profile.phonePlaceholder")}
						required
						value={phone}
					/>
				</Label>
				<Label>
					<span>
						{t("store.account.profile.cpf")} <RequiredMark />
					</span>
					<MaskedInput
						format="###.###.###-##"
						inputMode="numeric"
						mask="_"
						name="cpf"
						onValueChange={({ value }) => setCpf(value)}
						placeholder="000.000.000-00"
						required
						value={cpf}
					/>
				</Label>
			</div>
			<Button
				disabled={!dirty || !trimmedName || !validCpf || !validPhone || isSaving}
				type="submit"
			>
				{isSaving ? t("store.account.profile.saving") : t("store.account.profile.save")}
			</Button>
		</form>
	);
}
