import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { ConfirmActionButton } from "@/components/ui/ConfirmActionButton";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/Modal";
import { useDebouncedInput } from "@/hooks/use-debounced-input";
import type { PostCustomersMe200 } from "@/lib/api";
import { LuTrash2 } from "react-icons/lu";
import { AddressForm, type AddressValue } from "./AddressForm";

type Address = PostCustomersMe200["addresses"][number];
type View = "list" | "create";

interface AddressSelectorModalProps {
	addresses: Address[];
	isOpen: boolean;
	isSaving: boolean;
	onClose: () => void;
	onCreate: (address: AddressValue) => void;
	onDelete: (addressId: string) => void;
	onSelect: (address: Address) => void;
}

function formatAddress(address: Address) {
	return [address.addressLine, address.number, address.complement].filter(Boolean).join(", ");
}

export function AddressSelectorModal({
	addresses,
	isOpen,
	isSaving,
	onClose,
	onCreate,
	onDelete,
	onSelect,
}: AddressSelectorModalProps) {
	const { t } = useTranslation();
	const [view, setView] = useState<View>("list");
	const [search, setSearch] = useDebouncedInput("", () => undefined);

	useEffect(() => {
		if (isOpen) setView(addresses.length === 0 ? "create" : "list");
	}, [addresses.length, isOpen]);

	const visibleAddresses = useMemo(() => {
		const term = search.trim().toLocaleLowerCase();
		if (!term) return addresses;
		return addresses.filter(address =>
			[address.addressLine, address.number, address.neighborhood, address.city, address.state, address.zipCode]
				.filter(Boolean)
				.join(" ")
				.toLocaleLowerCase()
				.includes(term),
		);
	}, [addresses, search]);

	function handleClose() {
		setView("list");
		setSearch("");
		onClose();
	}

	return (
		<Modal
			isOpen={isOpen}
			maxWidth="640px"
			onClose={handleClose}
			title={t("store.checkout.address.selectTitle")}
		>
			<div className="space-y-4">
				<Input
					onChange={event => setSearch(event.currentTarget.value)}
					placeholder={t("store.checkout.address.searchPlaceholder")}
					value={search}
				/>
				<div className="space-y-2">
					{visibleAddresses.map(address => (
						<div
							className="flex w-full items-center gap-2 rounded-md border border-border p-3 transition-colors hover:bg-muted"
							key={address.id}
						>
							<button className="min-w-0 flex-1 cursor-pointer text-left" onClick={() => onSelect(address)} type="button">
							<div className="flex items-center gap-2">
								<p className="font-medium text-sm">{formatAddress(address)}</p>
								{address.isDefault && (
									<span className="rounded bg-primary/10 px-2 py-0.5 font-medium text-primary text-xs">
										{t("store.checkout.address.default")}
									</span>
								)}
							</div>
							<p className="text-muted-foreground text-sm">
								{[address.neighborhood, address.city, address.state].filter(Boolean).join(", ")}
							</p>
							</button>
							<ConfirmActionButton confirmation="Clique novamente para excluir este endereço" confirmLabel="Excluir" idleIcon={<LuTrash2 className="size-4" />} onConfirm={() => onDelete(address.id)} size="icon" type="button" variant="outline"><span className="sr-only">Excluir endereço</span></ConfirmActionButton>
						</div>
					))}
					{visibleAddresses.length === 0 && (
						<p className="text-muted-foreground text-sm">{t("store.checkout.address.noResults")}</p>
					)}
				</div>
				<Button onClick={() => setView("create")} type="button" variant="outline">
					{t("store.checkout.address.add")}
				</Button>
			</div>
			{view === "create" && (
				<Modal
					isOpen
					maxWidth="640px"
					onClose={() => setView("list")}
					title={t("store.checkout.address.addTitle")}
				>
					<AddressForm
						disabled={isSaving}
						footer={({ canSubmit, isSubmitting }) => (
							<div className="flex items-center justify-between gap-3 border-border border-t pt-4">
								<Button disabled={isSubmitting} onClick={() => setView(addresses.length === 0 ? "create" : "list")} type="button" variant="outline">
									{t("common.cancel", { defaultValue: "Cancelar" })}
								</Button>
								<Button disabled={!canSubmit || isSubmitting} type="submit">
									{t("store.checkout.address.save")}
								</Button>
							</div>
						)}
						onSubmit={onCreate}
					/>
				</Modal>
			)}
		</Modal>
	);
}
