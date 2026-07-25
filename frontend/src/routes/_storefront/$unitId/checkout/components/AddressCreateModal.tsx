import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/Modal";
import { AddressForm, type AddressValue } from "./AddressForm";

interface AddressCreateModalProps {
	isSubmodal?: boolean;
	isOpen: boolean;
	isSaving: boolean;
	onClose: () => void;
	onCreate: (address: AddressValue) => void;
}

export function AddressCreateModal({
	isOpen,
	isSaving,
	isSubmodal = false,
	onClose,
	onCreate,
}: AddressCreateModalProps) {
	const { t } = useTranslation();

	return (
		<Modal
			isOpen={isOpen}
			layer={isSubmodal ? "submodal" : "modal"}
			maxWidth="640px"
			onClose={onClose}
			title={t("store.checkout.address.addTitle")}
		>
			<AddressForm
				disabled={isSaving}
				footer={({ canSubmit, isSubmitting }) => (
					<div className="flex items-center justify-between gap-3 border-border border-t pt-4">
						<Button disabled={isSubmitting} onClick={onClose} type="button" variant="outline">
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
	);
}
