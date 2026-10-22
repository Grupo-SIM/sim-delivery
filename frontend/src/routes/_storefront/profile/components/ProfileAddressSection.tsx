import { useState } from "react";
import { useTranslation } from "react-i18next";
import { LuPencil, LuPlus, LuTrash2 } from "react-icons/lu";
import { AddressForm, type AddressValue } from "@/components/address";
import { Button } from "@/components/ui/button";
import { ConfirmActionButton } from "@/components/ui/ConfirmActionButton";
import { Modal } from "@/components/ui/Modal";

export interface ProfileAddress {
	addressLine: string;
	city: string | null;
	complement: string | null;
	id: string;
	isDefault: boolean;
	latitude: number | null;
	longitude: number | null;
	neighborhood: string | null;
	number: string;
	reference: string | null;
	state: string | null;
	zipCode: string;
}

interface ProfileAddressSectionProps {
	addresses: ProfileAddress[];
	isSaving: boolean;
	onCreate: (address: AddressValue) => void;
	onDelete: (addressId: string) => void;
	onSetDefault: (addressId: string) => void;
	onUpdate: (addressId: string, address: AddressValue) => void;
}

function toAddressValue(address: ProfileAddress): AddressValue {
	return {
		addressLine: address.addressLine,
		city: address.city ?? "",
		complement: address.complement ?? "",
		latitude: address.latitude,
		longitude: address.longitude,
		neighborhood: address.neighborhood ?? "",
		number: address.number,
		reference: address.reference ?? "",
		state: address.state ?? "",
		zipCode: address.zipCode,
	};
}

export function ProfileAddressSection({
	addresses,
	isSaving,
	onCreate,
	onDelete,
	onSetDefault,
	onUpdate,
}: ProfileAddressSectionProps) {
	const { t } = useTranslation();
	const [modal, setModal] = useState<"create" | ProfileAddress | null>(null);
	const editing = typeof modal === "object" ? modal : null;
	const title =
		modal === "create" ? t("store.account.profile.addAddress") : t("store.account.profile.editAddress");

	function handleSubmit(value: AddressValue) {
		if (editing) onUpdate(editing.id, value);
		else onCreate(value);
		setModal(null);
	}

	return (
		<section className="space-y-4 rounded-xl border border-border bg-card text-card-foreground p-5">
			<div className="flex items-center justify-between gap-3">
				<h2 className="font-semibold text-lg">{t("store.account.profile.addresses")}</h2>
				<Button onClick={() => setModal("create")} size="sm" type="button">
					<LuPlus className="size-4" /> {t("store.account.profile.addAddress")}
				</Button>
			</div>
			{addresses.length === 0 ? (
				<p className="text-muted-foreground text-sm">{t("store.account.profile.noAddresses")}</p>
			) : (
				<div className="space-y-3">
					{addresses.map(address => (
						<div className="rounded-lg border border-border p-4" key={address.id}>
							<div className="flex flex-wrap items-start justify-between gap-3">
								<div>
									<p className="font-medium">
										{address.addressLine}, {address.number}
									</p>
									<p className="text-muted-foreground text-sm">
										{[address.neighborhood, address.city, address.state].filter(Boolean).join(", ")}
									</p>
									{address.isDefault && (
										<span className="text-primary text-xs">{t("store.account.profile.defaultAddress")}</span>
									)}
								</div>
								<div className="flex gap-2">
									<Button
										aria-label={t("store.account.profile.editAddress")}
										onClick={() => setModal(address)}
										size="icon"
										type="button"
										variant="outline"
									>
										<LuPencil className="size-4" />
									</Button>
									<ConfirmActionButton
										aria-label={t("store.account.profile.deleteAddress")}
										confirmation={t("store.account.profile.deleteConfirm")}
										confirmLabel={t("store.account.profile.deleteAddress")}
										idleIcon={<LuTrash2 className="size-4" />}
										onConfirm={() => onDelete(address.id)}
										size="icon"
										type="button"
										variant="outline"
									>
										<span className="sr-only">{t("store.account.profile.deleteAddress")}</span>
									</ConfirmActionButton>
								</div>
							</div>
							{!address.isDefault && (
								<Button
									className="mt-3"
									disabled={isSaving}
									onClick={() => onSetDefault(address.id)}
									size="sm"
									type="button"
									variant="outline"
								>
									{t("store.account.profile.setDefault")}
								</Button>
							)}
						</div>
					))}
				</div>
			)}
			<Modal
				isOpen={modal !== null}
				onClose={() => setModal(null)}
				title={title}
				urlKey={modal === "create" ? "profile-address-create" : "profile-address-edit"}
				urlState={modal && typeof modal === "object" ? modal.id : undefined}
			>
				<AddressForm
					disabled={isSaving}
					footer={({ canSubmit, isSubmitting }) => (
						<div className="flex justify-end gap-3 border-border border-t pt-4">
							<Button onClick={() => setModal(null)} type="button" variant="outline">
								{t("actions.cancel")}
							</Button>
							<Button disabled={!canSubmit || isSubmitting} type="submit">
								{t("store.account.profile.save")}
							</Button>
						</div>
					)}
					initialValue={editing ? toAddressValue(editing) : undefined}
					key={editing?.id ?? "create"}
					onSubmit={handleSubmit}
				/>
			</Modal>
		</section>
	);
}
