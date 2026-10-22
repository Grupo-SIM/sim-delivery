import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { CollapsibleModalSection } from "@/components/ui/CollapsibleModalSection";
import { CustomSelect } from "@/components/ui/CustomSelect";
import { Input } from "@/components/ui/input";
import { Label, RequiredMark } from "@/components/ui/label";
import { MaskedInput } from "@/components/ui/MaskedInput";
import { MediaUrlInput } from "@/components/ui/MediaUrlInput";
import { Modal } from "@/components/ui/Modal";
import { NumericInput } from "@/components/ui/NumericInput";
import { useDebouncedInput } from "@/hooks/use-debounced-input";
import { type GetUnits200, getCepByCep, getUnitsQueryKey, usePatchUnitsByUnitId } from "@/lib/api";
import { showAlert } from "@/stores";

type Unit = GetUnits200[number];
type Availability = "auto" | "closed" | "open";

interface AddressState {
	addressLine: string;
	city: string;
	complement: string;
	latitude: number | null;
	longitude: number | null;
	neighborhood: string;
	number: string;
	reference: string;
	state: string;
	zipCode: string;
}

interface UnitEditorProps {
	onClose: () => void;
	unit: Unit | null;
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

const toAvailability = (isOpenManual: boolean | null): Availability =>
	isOpenManual === null ? "auto" : isOpenManual ? "open" : "closed";
const toIsOpenManual = (availability: Availability): boolean | null =>
	availability === "auto" ? null : availability === "open";

function toAddressState(unit: Unit | null): AddressState {
	if (!unit) return emptyAddress;

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

function formatAddressSummary(address: AddressState) {
	return [
		[address.addressLine, address.number].filter(Boolean).join(", "),
		address.complement,
		address.neighborhood,
		[address.city, address.state].filter(Boolean).join(" - "),
		address.zipCode,
	]
		.filter(Boolean)
		.join(" · ");
}

export function UnitEditor({ onClose, unit }: UnitEditorProps) {
	const { t } = useTranslation();
	const queryClient = useQueryClient();
	const { isPending: isSaving, mutate } = usePatchUnitsByUnitId();
	const [address, setAddress] = useState<AddressState>(emptyAddress);
	const [availability, setAvailability] = useState<Availability>("auto");
	const [cashback, setCashback] = useState(0);
	const [cepError, setCepError] = useState<string | null>(null);
	const [imageUrl, setImageUrl] = useState("");
	const [lookingUp, setLookingUp] = useState(false);
	const [name, setName] = useState("");
	const [localName, setLocalName] = useDebouncedInput(name, setName);
	const [phone, setPhone] = useState("");
	const [whatsApp, setWhatsApp] = useState("");
	const [xUrl, setXUrl] = useState("");
	const [localXUrl, setLocalXUrl] = useDebouncedInput(xUrl, setXUrl);
	const [instagramUrl, setInstagramUrl] = useState("");
	const [localInstagramUrl, setLocalInstagramUrl] = useDebouncedInput(instagramUrl, setInstagramUrl);
	const [facebookUrl, setFacebookUrl] = useState("");
	const [localFacebookUrl, setLocalFacebookUrl] = useDebouncedInput(facebookUrl, setFacebookUrl);

	useEffect(() => {
		setAddress(toAddressState(unit));
		setAvailability(toAvailability(unit?.isOpenManual ?? null));
		setCashback(unit?.cashbackPercent ?? 0);
		setCepError(null);
		setImageUrl(unit?.imageUrl ?? "");
		setName(unit?.name ?? "");
		setPhone(unit?.phone ?? "");
		setWhatsApp(unit?.whatsApp ?? "");
		setXUrl(unit?.xUrl ?? "");
		setInstagramUrl(unit?.instagramUrl ?? "");
		setFacebookUrl(unit?.facebookUrl ?? "");
	}, [unit]);

	function setAddressField<K extends keyof AddressState>(key: K, value: AddressState[K]) {
		setAddress(current => ({ ...current, [key]: value }));
	}

	async function lookupCep(zipCode: string) {
		setCepError(null);
		setLookingUp(true);
		try {
			const result = await getCepByCep(zipCode);
			setAddress(current => ({
				...current,
				addressLine: result.addressLine,
				city: result.city,
				complement: result.complement || current.complement,
				latitude: result.latitude,
				longitude: result.longitude,
				neighborhood: result.neighborhood,
				state: result.state,
				zipCode,
			}));
		} catch {
			setCepError(t("admin.units.address.cepNotFound"));
		} finally {
			setLookingUp(false);
		}
	}

	function save() {
		if (!unit) return;

		mutate(
			{
				data: {
					...address,
					cashbackPercent: cashback,
					facebookUrl: localFacebookUrl.trim() || null,
					imageUrl: imageUrl.trim() || null,
					instagramUrl: localInstagramUrl.trim() || null,
					isOpenManual: toIsOpenManual(availability),
					name: localName.trim(),
					phone: phone || null,
					whatsApp: whatsApp || null,
					xUrl: localXUrl.trim() || null,
				},
				unitId: unit.id,
			},
			{
				onError: () => void showAlert(t("admin.units.config.error")),
				onSuccess: async () => {
					await queryClient.invalidateQueries({ queryKey: getUnitsQueryKey() });
					onClose();
				},
			},
		);
	}

	return (
		<Modal
			isOpen={unit !== null}
			maxWidth="760px"
			onClose={onClose}
			title={t("admin.units.config.title")}
			urlKey="unit-edit"
			urlState={unit?.id}
		>
			<div className="space-y-6">
				<section className="space-y-4">
					<Label>
						<span>
							{t("admin.units.config.name")} <RequiredMark />
						</span>
						<Input
							onChange={event => setLocalName(event.currentTarget.value)}
							placeholder={t("admin.units.config.namePlaceholder")}
							required
							value={localName}
						/>
					</Label>
					<div className="space-y-2">
						<span className="font-medium text-sm">{t("admin.units.config.cashback")}</span>
						<NumericInput
							decimalScale={2}
							decimalSeparator=","
							onValueChange={({ floatValue }) => setCashback(floatValue ?? 0)}
							placeholder="5 %"
							suffix=" %"
							value={cashback}
						/>
					</div>
					<div className="space-y-2">
						<span className="font-medium text-sm">{t("admin.units.config.availability")}</span>
						<CustomSelect
							onChange={value => setAvailability(value as Availability)}
							options={[
								{ label: t("admin.units.config.availabilityAuto"), value: "auto" },
								{ label: t("admin.units.config.availabilityOpen"), value: "open" },
								{ label: t("admin.units.config.availabilityClosed"), value: "closed" },
							]}
							value={availability}
						/>
					</div>
				</section>

				<section className="space-y-4 border-border border-t pt-6">
					<h2 className="font-semibold text-lg">{t("admin.units.config.contact.title")}</h2>
					<div className="grid gap-4 sm:grid-cols-2">
						<Label>
							{t("admin.units.config.contact.phone")}
							<MaskedInput
								format="(##) #####-####"
								inputMode="numeric"
								mask="_"
								onValueChange={({ value }) => setPhone(value)}
								placeholder="(11) 90000-0000"
								value={phone}
							/>
						</Label>
						<Label>
							{t("admin.units.config.contact.whatsApp")}
							<MaskedInput
								format="(##) #####-####"
								inputMode="numeric"
								mask="_"
								onValueChange={({ value }) => setWhatsApp(value)}
								placeholder="(11) 90000-0000"
								value={whatsApp}
							/>
						</Label>
					</div>
					<Label>
						{t("admin.units.config.contact.instagram")}
						<Input
							onChange={event => setLocalInstagramUrl(event.currentTarget.value)}
							placeholder="https://instagram.com/minhaunidade"
							value={localInstagramUrl}
						/>
					</Label>
					<Label>
						{t("admin.units.config.contact.x")}
						<Input
							onChange={event => setLocalXUrl(event.currentTarget.value)}
							placeholder="https://x.com/minhaunidade"
							value={localXUrl}
						/>
					</Label>
					<Label>
						{t("admin.units.config.contact.facebook")}
						<Input
							onChange={event => setLocalFacebookUrl(event.currentTarget.value)}
							placeholder="https://facebook.com/minhaunidade"
							value={localFacebookUrl}
						/>
					</Label>
				</section>

				<CollapsibleModalSection
					summary={formatAddressSummary(address) || "—"}
					title={t("admin.units.address.title")}
				>
					<Label>
						{t("admin.units.address.cep")}
						<MaskedInput
							format="#####-###"
							inputMode="numeric"
							mask="_"
							onValueChange={({ value }) => {
								setAddressField("zipCode", value);
								if (value.length === 8) void lookupCep(value);
							}}
							placeholder="00000-000"
							value={address.zipCode}
						/>
						{lookingUp && (
							<span className="text-muted-foreground text-xs">{t("admin.units.address.searching")}</span>
						)}
						{cepError && <span className="text-destructive text-xs">{cepError}</span>}
					</Label>
					<Label>
						{t("admin.units.address.street")}
						<Input
							onChange={event => setAddressField("addressLine", event.currentTarget.value)}
							placeholder={t("admin.units.address.streetPlaceholder")}
							value={address.addressLine}
						/>
					</Label>
					<div className="grid grid-cols-2 gap-4">
						<Label>
							{t("admin.units.address.number")}
							<Input
								inputMode="numeric"
								onChange={event => setAddressField("number", event.currentTarget.value)}
								placeholder="123"
								value={address.number}
							/>
						</Label>
						<Label>
							{t("admin.units.address.complement")}
							<Input
								onChange={event => setAddressField("complement", event.currentTarget.value)}
								placeholder={t("admin.units.address.complementPlaceholder")}
								value={address.complement}
							/>
						</Label>
					</div>
					<Label>
						{t("admin.units.address.neighborhood")}
						<Input
							onChange={event => setAddressField("neighborhood", event.currentTarget.value)}
							placeholder={t("admin.units.address.neighborhoodPlaceholder")}
							value={address.neighborhood}
						/>
					</Label>
					<div className="grid grid-cols-[1fr_5rem] gap-4">
						<Label>
							{t("admin.units.address.city")}
							<Input
								onChange={event => setAddressField("city", event.currentTarget.value)}
								placeholder={t("admin.units.address.cityPlaceholder")}
								value={address.city}
							/>
						</Label>
						<Label>
							{t("admin.units.address.state")}
							<Input
								maxLength={2}
								onChange={event => setAddressField("state", event.currentTarget.value.toUpperCase())}
								placeholder="SP"
								value={address.state}
							/>
						</Label>
					</div>
					<Label>
						{t("admin.units.address.reference")}
						<Input
							onChange={event => setAddressField("reference", event.currentTarget.value)}
							placeholder={t("admin.units.address.referencePlaceholder")}
							value={address.reference}
						/>
					</Label>
				</CollapsibleModalSection>

				<section className="space-y-4 border-border border-t pt-6">
					<h2 className="font-semibold text-lg">{t("admin.units.image.title")}</h2>
					<MediaUrlInput
						asset="unit"
						onUploadError={() => void showAlert(t("admin.units.image.uploadError"))}
						onValueChange={setImageUrl}
						preview
						previewClassName="h-60"
						uploadLabel={t("admin.units.image.upload")}
						value={imageUrl}
					/>
				</section>


				<div className="flex justify-end gap-2 pt-2">
					<Button onClick={onClose} type="button" variant="outline">
						{t("admin.units.config.cancel")}
					</Button>
					<Button disabled={isSaving || !localName.trim()} onClick={save} type="button">
						{isSaving ? t("admin.units.config.saving") : t("admin.units.config.save")}
					</Button>
				</div>
			</div>
		</Modal>
	);
}
