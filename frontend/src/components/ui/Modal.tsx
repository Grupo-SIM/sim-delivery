import * as Dialog from "@radix-ui/react-dialog";
import { type ReactNode, useState } from "react";
import { LuX } from "react-icons/lu";
import { Scrollbar } from "./Scrollbar";

interface ModalProps {
	layer?: "modal" | "submodal";
	isOpen: boolean;
	onClose: () => void;
	title?: ReactNode;
	children: ReactNode;
	maxWidth?: string;
}

export function Modal({ children, isOpen, layer = "modal", maxWidth = "640px", onClose, title }: ModalProps) {
	const zIndexClass = layer === "submodal" ? "z-[60]" : "z-50";
	const [content, setContent] = useState<HTMLDivElement | null>(null);

	return (
		<Dialog.Root
			onOpenChange={open => {
				if (!open) onClose();
			}}
			open={isOpen}
		>
			<Dialog.Portal>
				<Dialog.Overlay className={`fixed inset-0 ${zIndexClass} bg-black/55 backdrop-blur-sm`} />
				<Dialog.Content
					className={`fixed top-1/2 left-1/2 ${zIndexClass} w-[calc(100vw-2rem)] max-w-[calc(100vw-2rem)] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-2xl bg-card text-card-foreground shadow-2xl sm:w-[92vw] sm:max-w-[92vw]`}
					style={{ maxWidth }}
				>
					<div
						className="scrollbar-none max-h-[calc(100dvh-2rem)] overflow-y-auto overflow-x-hidden p-4 pr-7 sm:p-7 sm:pr-10"
						ref={setContent}
					>
						<div className="mb-2 flex justify-end">
							<Dialog.Close
								aria-label="Fechar"
								className="grid size-9 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
							>
								<LuX className="size-5" />
							</Dialog.Close>
						</div>
						{title && <Dialog.Title className="font-bold text-xl">{title}</Dialog.Title>}
						<div className={title ? "min-w-0 pt-4" : "min-w-0"}>{children}</div>
					</div>
					<Scrollbar container={content} />
				</Dialog.Content>
			</Dialog.Portal>
		</Dialog.Root>
	);
}
