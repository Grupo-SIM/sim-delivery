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
						maxWidth,
						transitionDuration: "150ms",
						width: "92vw",
					},
				},
				DialogContainer: {
					style: {
						backdropFilter: "blur(4px)",
						backgroundColor: "rgba(0,0,0,0.55)",
						transitionDuration: "150ms",
					},
				},
				Root: {
					style: { zIndex: 9999 },
				},
			}}
			role={ROLE.dialog}
			size={SIZE.auto}
		>
			{title && (
				<ModalHeader
					$style={{ fontSize: "20px", fontWeight: 700, lineHeight: "28px", padding: "28px 64px 0 28px" }}
				>
					{title}
				</ModalHeader>
			)}
			<ModalBody $style={{ fontSize: "16px", lineHeight: "24px", padding: "28px 64px 28px 28px" }}>
				{children}
			</ModalBody>
		</BaseModal>
	);
}
