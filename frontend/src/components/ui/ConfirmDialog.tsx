import { Modal, ModalBody, ModalButton, ModalFooter, ModalHeader, ROLE, SIZE } from "baseui/modal";
import { useTranslation } from "react-i18next";
import { useDialogStore } from "@/stores/dialog";

export function ConfirmDialog() {
	const { t } = useTranslation();
	const { close, current } = useDialogStore();

	if (!current) return null;

	const isConfirm = current.type === "confirm";

	return (
		<Modal
			animate
			autoFocus
			isOpen
			onClose={() => close(false)}
			overrides={{
				Close: {
					style: {
						borderRadius: "10px",
						height: "36px",
						right: "14px",
						top: "14px",
						width: "36px",
					},
				},
				Dialog: {
					style: {
						borderRadius: "24px",
						maxWidth: "420px",
						width: "92vw",
					},
				},
				DialogContainer: {
					style: {
						backdropFilter: "blur(4px)",
						backgroundColor: "rgba(0,0,0,0.55)",
					},
				},
				Root: {
					style: { zIndex: 9999 },
				},
			}}
			role={ROLE.alertdialog}
			size={SIZE.auto}
		>
			{current.title && (
				<ModalHeader
					$style={{ fontSize: "20px", fontWeight: 700, lineHeight: "28px", padding: "28px 64px 0 28px" }}
				>
					{current.title}
				</ModalHeader>
			)}
			<ModalBody $style={{ fontSize: "16px", lineHeight: "24px", padding: "28px 64px 24px 28px" }}>
				<span className="whitespace-pre-line">{current.message}</span>
			</ModalBody>
			<ModalFooter $style={{ gap: "12px", padding: "0 28px 28px" }}>
				{isConfirm && (
					<ModalButton kind="tertiary" onClick={() => close(false)}>
						{t("actions.cancel")}
					</ModalButton>
				)}
				<ModalButton autoFocus onClick={() => close(true)}>
					{isConfirm ? (current.confirmLabel ?? t("actions.confirm")) : t("actions.ok")}
				</ModalButton>
			</ModalFooter>
		</Modal>
	);
}
