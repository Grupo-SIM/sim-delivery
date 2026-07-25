import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MaskedInput } from "@/components/ui/MaskedInput";

export interface ProfileValue {
	cpf: string;
	name: string;
}

interface ProfileFormProps {
	initialName?: string;
	onSubmit: (value: ProfileValue) => void;
}

export function ProfileForm({ initialName = "", onSubmit }: ProfileFormProps) {
	const { t } = useTranslation();
	const [name, setName] = useState(initialName);
	const [cpf, setCpf] = useState("");

	const canSubmit = name.trim().length > 0;

	return (
		<form
			className="space-y-4"
			onSubmit={event => {
				event.preventDefault();
				if (!canSubmit) return;
				onSubmit({ cpf: cpf.replace(/\D/g, ""), name: name.trim() });
			}}
		>
			<Label>
				{t("store.checkout.profile.name")}
				<Input
					autoFocus
					onChange={event => setName(event.currentTarget.value)}
					placeholder={t("store.checkout.profile.namePlaceholder")}
					value={name}
				/>
			</Label>

			<Label>
				{t("store.checkout.profile.cpf")}
				<MaskedInput
					format="###.###.###-##"
					inputMode="numeric"
					mask="_"
					onValueChange={({ formattedValue }) => setCpf(formattedValue)}
					placeholder={t("store.checkout.profile.cpfPlaceholder")}
					value={cpf}
				/>
			</Label>

			<Button className="w-full" disabled={!canSubmit} type="submit">
				{t("store.checkout.profile.submit")}
			</Button>
		</form>
	);
}
