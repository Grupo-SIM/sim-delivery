import { Modal as BaseModal, ModalBody, ModalHeader, ROLE, SIZE } from "baseui/modal";
import type { ReactNode } from "react";

interface ModalProps {
	isOpen: boolean;
	onClose: () => void;
	title?: ReactNode;
	children: ReactNode;
	maxWidth?: string;
}

export function Modal({ children, isOpen, maxWidth = "640px", onClose, title }: ModalProps) {
	return (
		<BaseModal
			animate
			autoFocus
			isOpen={isOpen}
			onClose={onClose}
			overrides={{
				Dialog: {
					style: {
						maxWidth,
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
			role={ROLE.dialog}
			size={SIZE.auto}
		>
			{title && <ModalHeader>{title}</ModalHeader>}
			<ModalBody>{children}</ModalBody>
		</BaseModal>
	);
}
