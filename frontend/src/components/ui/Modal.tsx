import * as Dialog from "@radix-ui/react-dialog";
import { type ReactNode, useCallback, useRef, useState } from "react";
import { LuX } from "react-icons/lu";
import { useModalHistory } from "@/hooks/use-modal-history";
import { ConfirmActionButton } from "./ConfirmActionButton";
import { Scrollbar } from "./Scrollbar";

interface ModalProps {
	historyMode?: "none" | "push" | "replace";
	layer?: "modal" | "submodal";
	isOpen: boolean;
	closeConfirmation?: {
		confirmation: string;
		confirmLabel: string;
		tooltip: string;
	};
	onClose: () => void;
	title?: ReactNode;
	children: ReactNode;
	maxWidth?: string;
	scrollable?: boolean;
	urlKey: string;
	urlState?: string;
}

export function Modal({
	children,
	closeConfirmation,
	historyMode = "push",
	isOpen,
	layer = "modal",
	maxWidth = "640px",
	onClose,
	scrollable = true,
	title,
	urlKey,
	urlState,
}: ModalProps) {
	const zIndexClass = layer === "submodal" ? "z-[60]" : "z-50";
	const [content, setContent] = useState<HTMLDivElement | null>(null);
	const contentRef = useRef<HTMLDivElement | null>(null);
	const [closeConfirming, setCloseConfirming] = useState(false);
	const closeWithHistory = useModalHistory({ historyMode, isOpen, onClose, urlKey, urlState });
	const setContentRef = useCallback((node: HTMLDivElement | null) => {
		contentRef.current = node;
		setContent(node);
	}, []);

	return (
		<Dialog.Root
			onOpenChange={open => {
				if (!open && closeConfirmation) setCloseConfirming(true);
				else if (!open) closeWithHistory();
			}}
			open={isOpen}
		>
			<Dialog.Portal>
				<Dialog.Overlay className={`fixed inset-0 ${zIndexClass} bg-black/55 backdrop-blur-sm`} />
				<Dialog.Content
					className={`fixed top-1/2 left-1/2 ${zIndexClass} w-[calc(100vw-2rem)] max-w-[calc(100vw-2rem)] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-2xl bg-card text-card-foreground shadow-2xl sm:w-[92vw] sm:max-w-[92vw]`}
					onOpenAutoFocus={event => {
						event.preventDefault();
						contentRef.current?.focus({ preventScroll: true });
					}}
					onEscapeKeyDown={event => {
						if (!closeConfirmation) return;
						event.preventDefault();
						setCloseConfirming(true);
					}}
					onPointerDownOutside={event => {
						if (!closeConfirmation) return;
						event.preventDefault();
						setCloseConfirming(true);
					}}
					style={{ maxWidth }}
				>
					<div
						className={`scrollbar-none max-h-[calc(100dvh-2rem)] overflow-x-hidden p-5 sm:p-7 ${
							scrollable ? "overflow-y-auto" : "flex h-[calc(100dvh-2rem)] flex-col overflow-y-hidden"
						}`}
						ref={setContentRef}
					>
						<div
							className={`flex shrink-0 items-start gap-4 ${
								title ? "border-border/70 border-b pb-5" : "justify-end"
							}`}
						>
							{title && <Dialog.Title className="min-w-0 flex-1 font-bold text-xl leading-tight">{title}</Dialog.Title>}
							{closeConfirmation ? (
								<ConfirmActionButton
									aria-label={closeConfirmation.tooltip}
									className="text-muted-foreground hover:bg-muted hover:text-foreground"
									confirming={closeConfirming}
									confirmation={closeConfirmation.confirmation}
									confirmLabel={closeConfirmation.confirmLabel}
									idleIcon={<LuX className="size-5" />}
									onConfirm={closeWithHistory}
									onConfirmingChange={setCloseConfirming}
									size="icon"
									tooltip={closeConfirmation.tooltip}
									type="button"
									variant="outline"
								>
									<span className="sr-only">{closeConfirmation.tooltip}</span>
								</ConfirmActionButton>
							) : (
								<Dialog.Close
									aria-label="Fechar"
									className="grid size-9 shrink-0 cursor-pointer place-items-center rounded-md border border-border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
								>
									<LuX className="size-5" />
								</Dialog.Close>
							)}
						</div>
						<div className={`${title ? "pt-5" : ""} min-w-0 ${scrollable ? "" : "min-h-0 flex-1"}`}>
							{children}
						</div>
					</div>
					{scrollable && (
						<Scrollbar className="sm:top-7 sm:right-4 sm:bottom-7" container={content} />
					)}
				</Dialog.Content>
			</Dialog.Portal>
		</Dialog.Root>
	);
}
