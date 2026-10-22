import { useDebouncedInput } from "@/hooks/use-debounced-input";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label, RequiredMark } from "@/components/ui/label";
import { MaskedInput } from "@/components/ui/MaskedInput";
import { getBrazilianMobileDigits, hasCompletePaymentIdentity, toBrazilianMobilePhone } from "./payment-identity";

interface PaymentIdentityFormProps {
	initialCpf: string | null;
	initialName: string;
	initialPhone: string | null;
	isSaving: boolean;
	onSubmit: (value: { cpf: string; name: string; phone: string }) => void;
}

export function PaymentIdentityForm({
	initialCpf,
	initialName,
	initialPhone,
	isSaving,
	onSubmit,
}: PaymentIdentityFormProps) {
	const { t } = useTranslation();
	const [name, setName] = useDebouncedInput(initialName, () => undefined);
	const [cpf, setCpf] = useState(initialCpf ?? "");
	const [phone, setPhone] = useState(getBrazilianMobileDigits(initialPhone));
	const cpfDigits = cpf.replace(/\D/g, "");
	const phoneDigits = phone.replace(/\D/g, "");
	const canSubmit = hasCompletePaymentIdentity(name, cpf, phone);

	return (
		<form
			className="space-y-4 rounded-xl border border-border bg-card text-card-foreground p-4"
			onSubmit={event => {
				event.preventDefault();
				if (!canSubmit) return;
				onSubmit({ cpf: cpfDigits, name: name.trim(), phone: toBrazilianMobilePhone(phoneDigits) });
			}}
		>
			<div className="space-y-1">
				<p className="font-semibold">{t("store.checkout.payment.identity.title")}</p>
				<p className="text-muted-foreground text-sm">{t("store.checkout.payment.identity.subtitle")}</p>
			</div>
			<Label>
				<span>
					{t("store.checkout.payment.identity.name")} <RequiredMark />
				</span>
				<Input
					autoComplete="name"
					name="full-name"
					onChange={event => setName(event.currentTarget.value)}
					placeholder={t("store.checkout.payment.identity.namePlaceholder")}
					value={name}
				/>
			</Label>
			<Label>
				<span>
					{t("store.checkout.payment.cpf")} <RequiredMark />
				</span>
				<MaskedInput
					format="###.###.###-##"
					inputMode="numeric"
					mask="_"
					name="cpf"
					onValueChange={({ formattedValue }) => setCpf(formattedValue)}
					placeholder={t("store.checkout.payment.cpfPlaceholder")}
					value={cpf}
				/>
			</Label>
			<Label>
				<span>
					{t("store.checkout.payment.identity.phone")} <RequiredMark />
				</span>
				<MaskedInput
					autoComplete="tel"
					format="+55 (##) #####-####"
					inputMode="tel"
					mask="_"
					name="phone"
					onValueChange={({ value }) => setPhone(value)}
					placeholder={t("store.checkout.payment.identity.phonePlaceholder")}
					value={phone}
				/>
			</Label>
			<Button className="w-full" disabled={!canSubmit || isSaving} type="submit">
				{isSaving ? t("store.checkout.payment.identity.saving") : t("store.checkout.payment.identity.continue")}
			</Button>
		</form>
	);
}
