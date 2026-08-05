import { useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { CollapsibleFormSection } from "@/components/ui/CollapsibleFormSection";
import { FormSectionHeading } from "@/components/ui/FormSectionHeading";
import { Input } from "@/components/ui/input";
import { Label, RequiredMark } from "@/components/ui/label";
import { MaskedInput } from "@/components/ui/MaskedInput";
import { getCepByCep, getUnitsQueryKey, usePostUnits } from "@/lib/api";

interface AddressState {
	zipCode: string;
	addressLine: string;
	number: string;
	complement: string;
	neighborhood: string;
	city: string;
	state: string;
	reference: string;
}

const emptyAddress: AddressState = {
	addressLine: "",
	city: "",
	complement: "",
	neighborhood: "",
	number: "",
	reference: "",
	state: "",
	zipCode: "",
};

export function CreateUnitForm() {
	const { t } = useTranslation();
	const queryClient = useQueryClient();
	const [name, setName] = useState("");
	const [phone, setPhone] = useState("");
	const [address, setAddress] = useState<AddressState>(emptyAddress);
	const [error, setError] = useState<string | null>(null);
	const [lookingUp, setLookingUp] = useState(false);
	const [cepError, setCepError] = useState<string | null>(null);

	const { isPending, mutate } = usePostUnits();

	const hasData = useMemo(
		() =>
			name.trim() !== "" || phone.trim() !== "" || Object.values(address).some(value => value.trim() !== ""),
		[name, phone, address],
	);

	function set<K extends keyof AddressState>(key: K, next: AddressState[K]) {
		setAddress(prev => ({ ...prev, [key]: next }));
	}

	async function lookupCep(digits: string) {
		setCepError(null);
		setLookingUp(true);
		try {
			const found = await getCepByCep(digits);
			setAddress(prev => ({
				...prev,
				addressLine: found.addressLine,
				city: found.city,
				complement: found.complement || prev.complement,
				neighborhood: found.neighborhood,
				state: found.state,
				zipCode: digits,
			}));
		} catch {
			setCepError(t("admin.units.address.cepNotFound"));
		} finally {
			setLookingUp(false);
		}
	}

	return (
		<form
			className="group space-y-4 rounded-lg border border-border bg-card p-4"
			onSubmit={event => {
				event.preventDefault();
				setError(null);
				mutate(
					{ data: { name, phone: phone || null, ...address } },
					{
						onError: error => {
							const code = (error as { data?: { error?: string } } | undefined)?.data?.error;
							setError(
								code === "NO_COMPANY" ? t("admin.units.create.noCompany") : t("admin.units.create.error"),
							);
						},
						onSuccess: async () => {
							setName("");
							setPhone("");
							setAddress(emptyAddress);
							await queryClient.invalidateQueries({ queryKey: getUnitsQueryKey() });
						},
					},
				);
			}}
		>
			<FormSectionHeading>{t("admin.units.create.sectionBasic")}</FormSectionHeading>
			<div className="grid gap-4 sm:grid-cols-2">
				<Label>
					<span>
						{t("admin.units.create.name")} <RequiredMark />
					</span>
					<Input
						onChange={event => setName(event.currentTarget.value)}
						placeholder={t("admin.units.create.namePlaceholder")}
						required
						value={name}
					/>
				</Label>
				<CollapsibleFormSection expanded={hasData} visibleFrom="sm">
					<Label>
						{t("admin.units.create.phone")}
						<MaskedInput
							format="(##) #####-####"
							inputMode="numeric"
							mask="_"
							onValueChange={({ value: digits }) => setPhone(digits)}
							placeholder={t("admin.units.create.phonePlaceholder")}
							value={phone}
						/>
					</Label>
				</CollapsibleFormSection>
			</div>

			<CollapsibleFormSection expanded={hasData}>
				<FormSectionHeading>{t("admin.units.create.sectionAddress")}</FormSectionHeading>
				<div className="grid gap-4 sm:grid-cols-[10rem_1fr]">
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
							onChange={event => set("addressLine", event.currentTarget.value)}
							placeholder={t("admin.units.address.streetPlaceholder")}
							value={address.addressLine}
						/>
					</Label>
				</div>

				<div className="grid gap-4 sm:grid-cols-2">
					<Label>
						{t("admin.units.address.number")}
						<Input
							inputMode="numeric"
							onChange={event => set("number", event.currentTarget.value)}
							placeholder="123"
							value={address.number}
						/>
					</Label>
					<Label>
						{t("admin.units.address.complement")}
						<Input
							onChange={event => set("complement", event.currentTarget.value)}
							placeholder={t("admin.units.address.complementPlaceholder")}
							value={address.complement}
						/>
					</Label>
				</div>

				<div className="grid gap-4 sm:grid-cols-[1fr_1fr_5rem]">
					<Label>
						{t("admin.units.address.neighborhood")}
						<Input
							onChange={event => set("neighborhood", event.currentTarget.value)}
							placeholder={t("admin.units.address.neighborhoodPlaceholder")}
							value={address.neighborhood}
						/>
					</Label>
					<Label>
						{t("admin.units.address.city")}
						<Input
							onChange={event => set("city", event.currentTarget.value)}
							placeholder={t("admin.units.address.cityPlaceholder")}
							value={address.city}
						/>
					</Label>
					<Label>
						{t("admin.units.address.state")}
						<Input
							maxLength={2}
							onChange={event => set("state", event.currentTarget.value.toUpperCase())}
							placeholder="SP"
							value={address.state}
						/>
					</Label>
				</div>

				<Label>
					{t("admin.units.address.reference")}
					<Input
						onChange={event => set("reference", event.currentTarget.value)}
						placeholder={t("admin.units.address.referencePlaceholder")}
						value={address.reference}
					/>
				</Label>
			</CollapsibleFormSection>

			<div className="flex items-center justify-between gap-4">
				{error && <p className="text-destructive text-xs">{error}</p>}
				<Button className="ml-auto" disabled={isPending || !name} type="submit">
					{isPending ? t("admin.units.create.submitting") : t("admin.units.create.submit")}
				</Button>
			</div>
		</form>
	);
}
