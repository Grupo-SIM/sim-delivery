import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label, RequiredMark } from "@/components/ui/label";
import { MaskedInput } from "@/components/ui/MaskedInput";
import type { AuthUser } from "@/stores/auth";

interface ProfileDetailsFormProps {
	customer: { cpf: string | null; phone: string | null } | null;
	isSaving: boolean;
	onSave: (value: { cpf: string | null; name: string; phone: string | null }) => void;
	user: AuthUser;
}

export function ProfileDetailsForm({ customer, isSaving, onSave, user }: ProfileDetailsFormProps) {
	const { t } = useTranslation();
	const [name, setName] = useState(user.name);
	const [phone, setPhone] = useState(customer?.phone ?? "");
	const [cpf, setCpf] = useState(customer?.cpf ?? "");

	useEffect(() => setName(user.name), [user.name]);
	useEffect(() => {
		setPhone(customer?.phone ?? "");
		setCpf(customer?.cpf ?? "");
	}, [customer?.cpf, customer?.phone]);

	const trimmedName = name.trim();
	const phoneDigits = phone.replace(/\D/g, "");
	const cpfDigits = cpf.replace(/\D/g, "");
	const dirty =
		trimmedName !== user.name ||
		phoneDigits !== (customer?.phone ?? "") ||
		cpfDigits !== (customer?.cpf ?? "");
	const validPhone = phoneDigits.length === 0 || phoneDigits.length === 13;
	const validCpf = cpfDigits.length === 0 || cpfDigits.length === 11;

	return (
		<section className="space-y-4 rounded-xl border border-border bg-card p-5">
			<h2 className="font-semibold text-lg">{t("store.account.profile.personalData")}</h2>
			<Label>
				<span>
					{t("store.account.profile.name")} <RequiredMark />
				</span>
				<Input onChange={event => setName(event.currentTarget.value)} value={name} />
			</Label>
			<Label>
				{t("store.account.profile.email")}
				<Input disabled readOnly value={user.email} />
			</Label>
			<p className="text-muted-foreground text-xs">{t("store.account.profile.emailHint")}</p>
			<div className="grid gap-4 sm:grid-cols-2">
				<Label>
					{t("store.account.profile.phone")}
					<MaskedInput
						format="+55 (##) #####-####"
						inputMode="tel"
						mask="_"
						onValueChange={({ value }) => setPhone(value)}
						placeholder={t("store.account.profile.phonePlaceholder")}
						value={phone}
					/>
				</Label>
				<Label>
					{t("store.account.profile.cpf")}
					<MaskedInput
						format="###.###.###-##"
						inputMode="numeric"
						mask="_"
						onValueChange={({ value }) => setCpf(value)}
						placeholder="000.000.000-00"
						value={cpf}
					/>
				</Label>
			</div>
			<Button
				disabled={!dirty || !trimmedName || !validCpf || !validPhone || isSaving}
				onClick={() => onSave({ cpf: cpfDigits || null, name: trimmedName, phone: phoneDigits || null })}
				type="button"
			>
				{isSaving ? t("store.account.profile.saving") : t("store.account.profile.save")}
			</Button>
		</section>
	);
}
