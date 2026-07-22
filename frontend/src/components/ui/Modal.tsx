import * as Dialog from "@radix-ui/react-dialog";
import type { ReactNode } from "react";
import { LuX } from "react-icons/lu";

interface ModalProps {
	isOpen: boolean;
	onClose: () => void;
	title?: ReactNode;
	children: ReactNode;
	maxWidth?: string;
}
export function Modal({ children, isOpen, maxWidth = "640px", onClose, title }: ModalProps) {
	return (
		<Dialog.Root
			onOpenChange={open => {
				if (!open) onClose();
			}}
			open={isOpen}
		>
			<Dialog.Portal>
				<Dialog.Overlay className="fixed inset-0 z-50 bg-black/55 backdrop-blur-sm" />
				<Dialog.Content
					className="fixed top-1/2 left-1/2 z-50 max-h-[calc(100dvh-2rem)] w-[calc(100vw-2rem)] max-w-[calc(100vw-2rem)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto overflow-x-hidden rounded-2xl bg-card p-4 text-card-foreground shadow-2xl sm:w-[92vw] sm:max-w-[92vw] sm:p-7"
					style={{ maxWidth }}
				>
					<Dialog.Close
						aria-label="Fechar"
						className="absolute top-4 right-4 grid size-9 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
					>
						<LuX className="size-5" />
					</Dialog.Close>
					{title && <Dialog.Title className="pr-10 font-bold text-xl">{title}</Dialog.Title>}
					<div className={title ? "min-w-0 pt-4" : "min-w-0 pr-10"}>{children}</div>
				</Dialog.Content>
			</Dialog.Portal>
		</Dialog.Root>
	);
}
