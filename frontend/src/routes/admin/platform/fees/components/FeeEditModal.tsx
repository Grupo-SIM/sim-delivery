import { useQueryClient } from "@tanstack/react-query";
import { Modal } from "@/components/ui/Modal";
import { patchPlatformFeesByFeeId } from "@/lib/api";
import { showAlert, showToast } from "@/stores";
import { FeeForm } from "./FeeForm";
import type { FeeFormValue, PlatformFee } from "./types";

interface FeeEditModalProps {
	fee: PlatformFee | null;
	onClose: () => void;
}

export function FeeEditModal({ fee, onClose }: FeeEditModalProps) {
	const queryClient = useQueryClient();
	if (!fee) return null;

	async function save(value: FeeFormValue) {
		try {
			await patchPlatformFeesByFeeId(fee!.id, {
				active: value.active,
				displayMode: value.displayMode,
				name: value.name,
				value: value.value,
			});
			await queryClient.invalidateQueries({ queryKey: ["Platform Fees"] });
			showToast("Taxa atualizada.", "positive");
			history.back();
		} catch {
			void showAlert("Não foi possível atualizar a taxa.");
		}
	}

	return (
		<Modal isOpen onClose={onClose} title="Editar taxa" urlKey="edit-platform-fee" urlState={fee.id}>
			<FeeForm
				initial={{
					active: fee.active,
					applicationScope: fee.applicationScope as FeeFormValue["applicationScope"],
					calculationType: fee.calculationType as FeeFormValue["calculationType"],
					displayMode: fee.displayMode as FeeFormValue["displayMode"],
					name: fee.name,
					value: Number(fee.value),
				}}
				isPending={false}
				lockKind
				onCancel={() => history.back()}
				onSubmit={value => void save(value)}
			/>
		</Modal>
	);
}
