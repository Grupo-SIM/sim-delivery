import { Modal } from "@/components/ui/Modal";

interface OptionImagePreviewModalProps {
	alt: string;
	imageUrl: string | null;
	onClose: () => void;
}

export function OptionImagePreviewModal({ alt, imageUrl, onClose }: OptionImagePreviewModalProps) {
	return (
		<Modal isOpen={imageUrl !== null} maxWidth="min(calc(100vw - 1rem), 1200px)" onClose={onClose}>
			{imageUrl && (
				<img
					alt={alt}
					className="max-h-[calc(100dvh-7rem)] w-full rounded-brand object-contain"
					src={imageUrl}
				/>
			)}
		</Modal>
	);
}
