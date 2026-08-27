import * as Dialog from "@radix-ui/react-dialog";
import { LuX } from "react-icons/lu";
import { useModalHistory } from "@/hooks/use-modal-history";

interface OptionImagePreviewModalProps {
	alt: string;
	imageUrl: string | null;
	onClose: () => void;
}

export function OptionImagePreviewModal({ alt, imageUrl, onClose }: OptionImagePreviewModalProps) {
	const closeWithHistory = useModalHistory({
		isOpen: imageUrl !== null,
		onClose,
		urlKey: "option-image-preview",
		urlState: imageUrl ?? undefined,
	});

	return (
		<Dialog.Root onOpenChange={open => !open && closeWithHistory()} open={imageUrl !== null}>
			<Dialog.Portal>
				<Dialog.Overlay className="fixed inset-0 z-[60] bg-black/55 backdrop-blur-sm" />
				<Dialog.Content className="fixed top-1/2 left-1/2 z-[60] flex aspect-square h-[75dvh] w-[75dvh] max-w-[calc(100vw-1rem)] -translate-x-1/2 -translate-y-1/2 items-center justify-center overflow-hidden rounded-2xl bg-card p-1 shadow-2xl focus:outline-none">
					<Dialog.Title className="sr-only">{alt}</Dialog.Title>
					{imageUrl && (
						<img
							alt={alt}
							className="size-full rounded-[calc(var(--radius-brand)-0.25rem)] object-contain"
							src={imageUrl}
						/>
					)}
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
