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
	scrollable?: boolean;
}

export function Modal({
	children,
	isOpen,
	layer = "modal",
	maxWidth = "640px",
	onClose,
	scrollable = true,
	title,
}: ModalProps) {
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
						className={`scrollbar-none max-h-[calc(100dvh-2rem)] overflow-x-hidden p-4 pr-7 sm:p-7 sm:pr-10 ${
							scrollable ? "overflow-y-auto" : "flex h-[calc(100dvh-2rem)] flex-col overflow-y-hidden"
						}`}
						ref={setContent}
					>
						<div className="mb-2 flex shrink-0 justify-end">
							<Dialog.Close
								aria-label="Fechar"
								className="grid size-9 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
							>
								<LuX className="size-5" />
							</Dialog.Close>
						</div>
						{title && <Dialog.Title className="shrink-0 font-bold text-xl">{title}</Dialog.Title>}
						<div className={`${title ? "pt-4" : ""} min-w-0 ${scrollable ? "" : "min-h-0 flex-1"}`}>
							{children}
						</div>
					</div>
					{scrollable && <Scrollbar container={content} />}
				</Dialog.Content>
			</Dialog.Portal>
		</Dialog.Root>
	);
}
