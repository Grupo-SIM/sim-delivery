import { useState } from "react";
import { useTranslation } from "react-i18next";
import { PatternFormat } from "react-number-format";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/Checkbox";
import { Input } from "@/components/ui/input";
import { useDebouncedInput } from "@/hooks/use-debounced-input";
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

	const [cpf, setCpf] = useDebouncedInput(value.cpf, digits => set("cpf", digits));
	const [zipCode, setZipCode] = useDebouncedInput(value.zipCode, digits => {
		set("zipCode", digits);
		if (digits.length === 8) void lookupCep(digits);
	});
	const [addressLine, setAddressLine] = useDebouncedInput(value.addressLine, next => set("addressLine", next));
	const [addressNumber, setAddressNumber] = useDebouncedInput(value.number, next => set("number", next));
	const [complement, setComplement] = useDebouncedInput(value.complement, next => set("complement", next));
	const [neighborhood, setNeighborhood] = useDebouncedInput(value.neighborhood, next => set("neighborhood", next));
	const [city, setCity] = useDebouncedInput(value.city, next => set("city", next));
	const [state, setState] = useDebouncedInput(value.state, next => set("state", next.toUpperCase()));
	const [reference, setReference] = useDebouncedInput(value.reference, next => set("reference", next));

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

	const number = noNumber ? "S/N" : addressNumber;
	const currentValue = {
		...value,
		addressLine,
		city,
		complement,
		cpf,
		neighborhood,
		number,
		reference,
		state,
		zipCode,
	};
	const canSubmit =
		currentValue.cpf.length === 11 &&
		currentValue.zipCode.length === 8 &&
		currentValue.addressLine.trim() !== "" &&
		currentValue.number.trim() !== "" &&
		currentValue.neighborhood.trim() !== "" &&
		currentValue.city.trim() !== "" &&
		currentValue.state.trim().length === 2;
	const requiredField = <RequiredMark />;

	return (
		<form
			className="space-y-4"
			onSubmit={event => {
				event.preventDefault();
				if (!canSubmit) return;
				onSubmit?.(currentValue);
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
					onValueChange={({ value: digits }) => setCpf(digits)}
					placeholder={t("store.checkout.address.cpfPlaceholder")}
					value={cpf}
				/>
			</Label>

			<Label>
				<span>
					{t("store.checkout.address.cep")} {requiredField}
				</span>
				<PatternFormat
					customInput={Input}
					format="#####-###"
					inputMode="numeric"
					mask="_"
					onValueChange={({ value: digits }) => setZipCode(digits)}
					placeholder="00000-000"
					value={zipCode}
				/>
				{lookingUp && (
					<span className="text-muted-foreground text-xs">{t("store.checkout.address.searching")}</span>
				)}
				{cepError && <span className="text-destructive text-xs">{cepError}</span>}
			</Label>

			<Label>
				<span>
					{t("store.checkout.address.street")} {requiredField}
				</span>
				<Input
					onChange={event => setAddressLine(event.currentTarget.value)}
					placeholder={t("store.checkout.address.streetPlaceholder")}
					value={addressLine}
				/>
			</Label>

			<div className="grid grid-cols-2 gap-4">
				<Label>
					<span>
						{t("store.checkout.address.number")} {requiredField}
					</span>
					<Input
						disabled={noNumber}
						inputMode="numeric"
						onChange={event => setAddressNumber(event.currentTarget.value)}
						placeholder="123"
						value={number}
					/>
				</Label>
				<label className="flex cursor-pointer items-end gap-2 pb-3 font-medium text-sm">
					<Checkbox checked={noNumber} onChange={event => setNoNumber(event.currentTarget.checked)} />
					{t("store.checkout.address.noNumber")}
				</label>
			</div>

			<Label>
				{t("store.checkout.address.complement")}
				<Input
					onChange={event => setComplement(event.currentTarget.value)}
					placeholder={t("store.checkout.address.complementPlaceholder")}
					value={complement}
				/>
			</Label>

			<Label>
				<span>
					{t("store.checkout.address.neighborhood")} {requiredField}
				</span>
				<Input
					onChange={event => setNeighborhood(event.currentTarget.value)}
					placeholder={t("store.checkout.address.neighborhoodPlaceholder")}
					value={neighborhood}
				/>
			</Label>

			<div className="grid grid-cols-[1fr_5rem] gap-4">
				<Label>
					<span>
						{t("store.checkout.address.city")} {requiredField}
					</span>
					<Input
						onChange={event => setCity(event.currentTarget.value)}
						placeholder={t("store.checkout.address.cityPlaceholder")}
						value={city}
					/>
				</Label>
				<Label>
					<span>
						{t("store.checkout.address.state")} {requiredField}
					</span>
					<Input
						maxLength={2}
						onChange={event => setState(event.currentTarget.value)}
						placeholder="SP"
						value={state}
					/>
				</Label>
			</div>

			<Label>
				{t("store.checkout.address.reference")}
				<Input
					onChange={event => setReference(event.currentTarget.value)}
					placeholder={t("store.checkout.address.referencePlaceholder")}
					value={reference}
				/>
			</Label>

			<Button className="w-full" disabled={!canSubmit || disabled} type="submit">
				{t("store.checkout.address.continue")}
			</Button>
		</form>
	);
}
