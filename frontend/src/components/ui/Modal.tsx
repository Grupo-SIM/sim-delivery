import * as Dialog from "@radix-ui/react-dialog";
import { LuX } from "react-icons/lu";
import type { ReactNode } from "react";

interface ModalProps { isOpen: boolean; onClose: () => void; title?: ReactNode; children: ReactNode; maxWidth?: string; }
export function Modal({ children, isOpen, maxWidth = "640px", onClose, title }: ModalProps) {
	return <Dialog.Root open={isOpen} onOpenChange={open => { if (!open) onClose(); }}><Dialog.Portal><Dialog.Overlay className="fixed inset-0 z-50 bg-black/55 backdrop-blur-sm" /><Dialog.Content className="fixed top-1/2 left-1/2 z-50 w-[92vw] -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-card p-7 text-card-foreground shadow-2xl" style={{ maxWidth }}><Dialog.Close aria-label="Fechar" className="absolute top-4 right-4 grid size-9 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"><LuX className="size-5" /></Dialog.Close>{title && <Dialog.Title className="pr-10 font-bold text-xl">{title}</Dialog.Title>}<div className={title ? "pt-4" : "pr-10"}>{children}</div></Dialog.Content></Dialog.Portal></Dialog.Root>;
}