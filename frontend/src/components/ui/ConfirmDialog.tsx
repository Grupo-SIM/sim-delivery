import { Modal, ModalBody, ModalButton, ModalFooter, ModalHeader, ROLE, SIZE } from "baseui/modal";
import { LuCircleAlert } from "react-icons/lu";
import { useTranslation } from "react-i18next";
import { useDialogStore } from "@/stores/dialog";

export function ConfirmDialog() {
	const { t } = useTranslation();
	const { close, current } = useDialogStore();

	if (!current) return null;

	const isConfirm = current.type === "confirm";
	const title = current.title ?? t(isConfirm ? "actions.confirm" : "actions.attention", { defaultValue: "Atenção" });

	return (
		<Modal
			animate
			autoFocus
			isOpen
			onClose={() => close(false)}
			overrides={{
				Close: {
					style: {
						borderRadius: "999px",
						height: "36px",
						right: "18px",
						top: "18px",
						width: "36px",
					},
				},
				Dialog: {
					style: {
						borderRadius: "18px",
						boxShadow: "0 24px 80px rgba(15, 23, 42, 0.25)",
						maxWidth: "460px",
						width: "92vw",
					},
				},
				DialogContainer: {
					style: {
						backdropFilter: "blur(6px)",
						backgroundColor: "rgba(15, 23, 42, 0.58)",
					},
				},
				Root: {
					style: { zIndex: 9999 },
				},
			}}
			role={ROLE.alertdialog}
			size={SIZE.auto}
		>
			<ModalHeader $style={{ padding: "28px 64px 0 28px" }}>
				<div className="flex items-start gap-3">
					<span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
						<LuCircleAlert aria-hidden className="size-5" />
					</span>
					<div>
						<h2 className="font-semibold text-foreground text-lg leading-6">{title}</h2>
					</div>
				</div>
			</ModalHeader>
			<ModalBody $style={{ padding: "14px 64px 24px 80px" }}>
				<p className="whitespace-pre-line text-muted-foreground text-sm leading-6">{current.message}</p>
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
