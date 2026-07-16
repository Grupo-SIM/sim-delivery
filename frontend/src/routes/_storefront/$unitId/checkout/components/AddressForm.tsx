import { useState } from "react";
import { useTranslation } from "react-i18next";
import { PatternFormat } from "react-number-format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label, RequiredMark } from "@/components/ui/label";
import { getCepByCep } from "@/lib/api";

export interface AddressValue {
	cpf: string;
	zipCode: string;
	addressLine: string;
	number: string;
	complement: string;
	neighborhood: string;
	city: string;
	state: string;
	reference: string;
	latitude: number | null;
	longitude: number | null;
}

const emptyAddress: AddressValue = {
	addressLine: "",
	city: "",
	complement: "",
	cpf: "",
	latitude: null,
	longitude: null,
	neighborhood: "",
	number: "",
	reference: "",
	state: "",
	zipCode: "",
};

interface AddressFormProps {
	disabled?: boolean;
	onSubmit?: (value: AddressValue) => void;
}

export function AddressForm({ disabled, onSubmit }: AddressFormProps) {
	const { t } = useTranslation();
	const [value, setValue] = useState<AddressValue>(emptyAddress);
	const [noNumber, setNoNumber] = useState(false);
	const [lookingUp, setLookingUp] = useState(false);
	const [cepError, setCepError] = useState<string | null>(null);

	function set<K extends keyof AddressValue>(key: K, next: AddressValue[K]) {
		setValue(prev => ({ ...prev, [key]: next }));
	}

	async function lookupCep(digits: string) {
		setCepError(null);
		setLookingUp(true);
		try {
			const address = await getCepByCep(digits);
			setValue(prev => ({
				...prev,
				addressLine: address.addressLine,
				city: address.city,
				complement: address.complement || prev.complement,
				latitude: address.latitude,
				longitude: address.longitude,
				neighborhood: address.neighborhood,
				state: address.state,
				zipCode: digits,
			}));
		} catch {
			setCepError(t("store.checkout.address.cepNotFound"));
		} finally {
			setLookingUp(false);
		}
	}

	const number = noNumber ? "S/N" : value.number;
	const canSubmit =
		value.cpf.length === 11 && value.zipCode.length === 8 && value.addressLine.trim() !== "" && number.trim() !== "";

	return (
		<form
			className="space-y-4"
			onSubmit={event => {
				event.preventDefault();
				if (!canSubmit) return;
				onSubmit?.({ ...value, number });
			}}
		>
			<Label>
				<span>
					{t("store.checkout.address.cpf")} <RequiredMark />
				</span>
				<PatternFormat
					customInput={Input}
					format="###.###.###-##"
					inputMode="numeric"
					mask="_"
					onValueChange={({ value: digits }) => set("cpf", digits)}
					placeholder={t("store.checkout.address.cpfPlaceholder")}
					value={value.cpf}
				/>
			</Label>

			<Label>
				{t("store.checkout.address.cep")}
				<PatternFormat
					customInput={Input}
					format="#####-###"
					inputMode="numeric"
					mask="_"
					onValueChange={({ value: digits }) => {
						set("zipCode", digits);
						if (digits.length === 8) void lookupCep(digits);
					}}
					placeholder="00000-000"
					value={value.zipCode}
				/>
				{lookingUp && (
					<span className="text-muted-foreground text-xs">{t("store.checkout.address.searching")}</span>
				)}
				{cepError && <span className="text-destructive text-xs">{cepError}</span>}
			</Label>

			<Label>
				{t("store.checkout.address.street")}
				<Input
					onChange={event => set("addressLine", event.currentTarget.value)}
					placeholder={t("store.checkout.address.streetPlaceholder")}
					value={value.addressLine}
				/>
			</Label>

			<div className="grid grid-cols-2 gap-4">
				<Label>
					{t("store.checkout.address.number")}
					<Input
						disabled={noNumber}
						inputMode="numeric"
						onChange={event => set("number", event.currentTarget.value)}
						placeholder="123"
						value={number}
					/>
				</Label>
				<label className="flex items-end gap-2 pb-3 font-medium text-sm">
					<input
						checked={noNumber}
						className="size-4"
						onChange={event => setNoNumber(event.currentTarget.checked)}
						type="checkbox"
					/>
					{t("store.checkout.address.noNumber")}
				</label>
			</div>

			<Label>
				{t("store.checkout.address.complement")}
				<Input
					onChange={event => set("complement", event.currentTarget.value)}
					placeholder={t("store.checkout.address.complementPlaceholder")}
					value={value.complement}
				/>
			</Label>

			<Label>
				{t("store.checkout.address.neighborhood")}
				<Input
					onChange={event => set("neighborhood", event.currentTarget.value)}
					placeholder={t("store.checkout.address.neighborhoodPlaceholder")}
					value={value.neighborhood}
				/>
			</Label>

			<div className="grid grid-cols-[1fr_5rem] gap-4">
				<Label>
					{t("store.checkout.address.city")}
					<Input
						onChange={event => set("city", event.currentTarget.value)}
						placeholder={t("store.checkout.address.cityPlaceholder")}
						value={value.city}
					/>
				</Label>
				<Label>
					{t("store.checkout.address.state")}
					<Input
						maxLength={2}
						onChange={event => set("state", event.currentTarget.value.toUpperCase())}
						placeholder="SP"
						value={value.state}
					/>
				</Label>
			</div>

			<Label>
				{t("store.checkout.address.reference")}
				<Input
					onChange={event => set("reference", event.currentTarget.value)}
					placeholder={t("store.checkout.address.referencePlaceholder")}
					value={value.reference}
				/>
			</Label>

			<Button className="w-full" disabled={!canSubmit || disabled} type="submit">
				{t("store.checkout.address.continue")}
			</Button>
		</form>
	);
}
