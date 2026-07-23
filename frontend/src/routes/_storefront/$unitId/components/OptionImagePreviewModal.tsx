import * as Dialog from "@radix-ui/react-dialog";
import { LuX } from "react-icons/lu";

interface OptionImagePreviewModalProps {
	alt: string;
	imageUrl: string | null;
	onClose: () => void;
}

export function OptionImagePreviewModal({ alt, imageUrl, onClose }: OptionImagePreviewModalProps) {
	return (
		<Dialog.Root onOpenChange={open => !open && onClose()} open={imageUrl !== null}>
			<Dialog.Portal>
				<Dialog.Overlay className="fixed inset-0 z-[60] bg-black/55 backdrop-blur-sm" />
				<Dialog.Content className="fixed inset-2 z-[60] flex items-center justify-center overflow-hidden rounded-2xl bg-card p-1 shadow-2xl focus:outline-none">
					<Dialog.Title className="sr-only">{alt}</Dialog.Title>
					{imageUrl && <img alt={alt} className="max-h-full max-w-full rounded-brand object-contain" src={imageUrl} />}
					<Dialog.Close
						aria-label="Fechar"
						className="absolute top-2 right-2 grid size-9 cursor-pointer place-items-center rounded-md border border-border bg-card text-muted-foreground shadow-sm hover:bg-muted hover:text-foreground"
					>
						<LuX className="size-5" />
					</Dialog.Close>
				</Dialog.Content>
			</Dialog.Portal>
		</Dialog.Root>
	);
}
