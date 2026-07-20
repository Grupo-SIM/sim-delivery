import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MaskedInput } from "@/components/ui/MaskedInput";
import { Label } from "@/components/ui/label";
import { Modal } from "@/components/ui/Modal";
import { type GetUnits200, getCepByCep, getUnitsQueryKey, usePatchUnitsByUnitId } from "@/lib/api";
import { showAlert } from "@/stores";

type Unit = GetUnits200[number];

interface AddressState {
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

const emptyAddress: AddressState = {
	addressLine: "",
	city: "",
	complement: "",
	latitude: null,
	longitude: null,
	neighborhood: "",
	number: "",
	reference: "",
	state: "",
	zipCode: "",
};

function toAddressState(unit: Unit | null): AddressState {
	if (!unit) {
		return emptyAddress;
	}
	return {
		addressLine: unit.addressLine ?? "",
		city: unit.city ?? "",
		complement: unit.complement ?? "",
		latitude: unit.latitude ?? null,
		longitude: unit.longitude ?? null,
		neighborhood: unit.neighborhood ?? "",
		number: unit.number ?? "",
		reference: unit.reference ?? "",
		state: unit.state ?? "",
		zipCode: unit.zipCode ?? "",
	};
}

interface UnitAddressEditorProps {
	onClose: () => void;
	unit: Unit | null;
}

export function UnitAddressEditor({ onClose, unit }: UnitAddressEditorProps) {
	const { t } = useTranslation();
	const queryClient = useQueryClient();
	const { isPending: isSaving, mutate } = usePatchUnitsByUnitId();
	const [value, setValue] = useState<AddressState>(emptyAddress);
	const [lookingUp, setLookingUp] = useState(false);
	const [cepError, setCepError] = useState<string | null>(null);

	useEffect(() => {
		setValue(toAddressState(unit));
		setCepError(null);
	}, [unit]);

	function set<K extends keyof AddressState>(key: K, next: AddressState[K]) {
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
			setCepError(t("admin.units.address.cepNotFound"));
		} finally {
			setLookingUp(false);
		}
	}

	function save() {
		if (!unit) {
			return;
		}
		mutate(
			{ data: { ...value }, unitId: unit.id },
			{
				onError: () => void showAlert(t("admin.units.address.error")),
				onSuccess: async () => {
					await queryClient.invalidateQueries({ queryKey: getUnitsQueryKey() });
					onClose();
				},
			},
		);
	}

	return (
		<Modal isOpen={unit !== null} onClose={onClose} title={t("admin.units.address.title")}>
			<div className="space-y-4">
				<Label>
					{t("admin.units.address.cep")}
					<MaskedInput
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
						<span className="text-muted-foreground text-xs">{t("admin.units.address.searching")}</span>
					)}
					{cepError && <span className="text-destructive text-xs">{cepError}</span>}
				</Label>

				<Label>
					{t("admin.units.address.street")}
					<Input
						onChange={event => set("addressLine", event.currentTarget.value)}
						placeholder={t("admin.units.address.streetPlaceholder")}
						value={value.addressLine}
					/>
				</Label>

				<div className="grid grid-cols-2 gap-4">
					<Label>
						{t("admin.units.address.number")}
						<Input
							inputMode="numeric"
							onChange={event => set("number", event.currentTarget.value)}
							placeholder="123"
							value={value.number}
						/>
					</Label>
					<Label>
						{t("admin.units.address.complement")}
						<Input
							onChange={event => set("complement", event.currentTarget.value)}
							placeholder={t("admin.units.address.complementPlaceholder")}
							value={value.complement}
						/>
					</Label>
				</div>

				<Label>
					{t("admin.units.address.neighborhood")}
					<Input
						onChange={event => set("neighborhood", event.currentTarget.value)}
						placeholder={t("admin.units.address.neighborhoodPlaceholder")}
						value={value.neighborhood}
					/>
				</Label>

				<div className="grid grid-cols-[1fr_5rem] gap-4">
					<Label>
						{t("admin.units.address.city")}
						<Input
							onChange={event => set("city", event.currentTarget.value)}
							placeholder={t("admin.units.address.cityPlaceholder")}
							value={value.city}
						/>
					</Label>
					<Label>
						{t("admin.units.address.state")}
						<Input
							maxLength={2}
							onChange={event => set("state", event.currentTarget.value.toUpperCase())}
							placeholder="SP"
							value={value.state}
						/>
					</Label>
				</div>

				<Label>
					{t("admin.units.address.reference")}
					<Input
						onChange={event => set("reference", event.currentTarget.value)}
						placeholder={t("admin.units.address.referencePlaceholder")}
						value={value.reference}
					/>
				</Label>

				<div className="flex justify-end gap-2 pt-2">
					<Button onClick={onClose} type="button" variant="outline">
						{t("admin.units.address.cancel")}
					</Button>
					<Button disabled={isSaving} onClick={save} type="button">
						{isSaving ? t("admin.units.address.saving") : t("admin.units.address.save")}
					</Button>
				</div>
			</div>
		</Modal>
	);
}
