import { type DragEvent, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { LuImageUp, LuLoaderCircle, LuTrash2, LuUpload } from "react-icons/lu";
import { useDebouncedInput } from "@/hooks/use-debounced-input";
import { deleteMedia, type MediaAsset, uploadMedia } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Input } from "./input";

const acceptByAsset: Record<MediaAsset, string> = {
	banner: "image/avif,image/jpeg,image/png,image/webp",
	"font-display": ".otf,.ttf,.woff,.woff2,font/otf,font/ttf,font/woff,font/woff2",
	"font-family": ".otf,.ttf,.woff,.woff2,font/otf,font/ttf,font/woff,font/woff2",
	logo: "image/avif,image/jpeg,image/png,image/webp",
	"mobile-icon": "image/avif,image/jpeg,image/png,image/webp",
	product: "image/avif,image/jpeg,image/png,image/webp",
	promotion: "image/avif,image/jpeg,image/png,image/webp",
	unit: "image/avif,image/jpeg,image/png,image/webp",
	whatsapp: "image/jpeg,image/png,image/webp,application/pdf",
};

const dimensionsByAsset: Partial<Record<MediaAsset, { width: number; height: number }>> = {
	banner: { width: 1112, height: 450 },
	"mobile-icon": { width: 512, height: 512 },
	product: { width: 408, height: 408 },
	unit: { width: 263, height: 219 },
};

interface MediaUrlInputProps {
	asset: MediaAsset;
	imageKind?: "option";
	onDeleteError?: () => void;
	onUploadError: () => void;
	onUploadingChange?: (isUploading: boolean) => void;
	onValueChange: (value: string) => void;
	placeholder?: string;
	/** Renders an image preview below the field. Ignored for font assets. */
	preview?: boolean;
	/** Overrides the preview dimensions, e.g. `"h-36 max-w-md"`. */
	previewClassName?: string;
	uploadLabel: string;
	value: string;
}

export function MediaUrlInput({
	asset,
	imageKind,
	onDeleteError,
	onUploadError,
	onUploadingChange,
	onValueChange,
	placeholder = "Envie um arquivo ou cole uma URL",
	preview = true,
	previewClassName,
	uploadLabel,
	value,
}: MediaUrlInputProps) {
	const { t } = useTranslation();
	const dragDepthRef = useRef(0);
	const fileInputRef = useRef<HTMLInputElement>(null);
	const [isDragging, setIsDragging] = useState(false);
	const [isDeleting, setIsDeleting] = useState(false);
	const [isUploading, setIsUploading] = useState(false);
	const [localValue, setLocalValue, flushValue] = useDebouncedInput(value, onValueChange);
	const isImageAsset = !asset.startsWith("font-") && asset !== "whatsapp";
	const dimensions = dimensionsByAsset[asset];
	const dimensionHint = imageKind === "option"
		? t("media.optionDimensions")
		: dimensions
			? t("media.recommendedDimensions", dimensions)
			: asset === "logo" || asset === "whatsapp"
				? t("media.anyDimensions")
				: undefined;
	const dropLabel = isImageAsset ? "Solte imagem aqui" : "Solte fonte aqui";

	async function upload(file: File) {
		setIsUploading(true);
		onUploadingChange?.(true);
		let uploadedUrl: string | null = null;
		try {
			uploadedUrl = await uploadMedia(asset, file);
			if (value && value !== uploadedUrl) await deleteMedia(asset, value);
			onValueChange(uploadedUrl);
		} catch {
			if (uploadedUrl) await deleteMedia(asset, uploadedUrl).catch(() => undefined);
			onUploadError();
		} finally {
			setIsUploading(false);
			onUploadingChange?.(false);
		}
	}
	async function removeImage() {
		setIsDeleting(true);
		try {
			if (value) await deleteMedia(asset, value);
			setLocalValue("");
			onValueChange("");
		} catch {
			if (onDeleteError) onDeleteError();
			else onUploadError();
		} finally {
			setIsDeleting(false);
		}
	}
	function handleDrop(event: DragEvent<HTMLDivElement>) {
		event.preventDefault();
		dragDepthRef.current = 0;
		setIsDragging(false);
		const file = event.dataTransfer.files[0];
		if (file) void upload(file);
	}
	function handleDragEnter(event: DragEvent<HTMLDivElement>) {
		event.preventDefault();
		dragDepthRef.current += 1;
		setIsDragging(true);
	}
	function handleDragLeave(event: DragEvent<HTMLDivElement>) {
		event.preventDefault();
		dragDepthRef.current -= 1;
		if (dragDepthRef.current <= 0) {
			dragDepthRef.current = 0;
			setIsDragging(false);
		}
	}

	return (
		<div className="grid justify-items-start gap-2">
			<span aria-live="polite" className="sr-only">
				{isUploading ? t("media.uploading") : ""}
			</span>
			<div
				className={cn(
					"relative w-full",
					"rounded-md border border-input border-dashed p-1 transition-colors",
					isDragging && "border-primary bg-primary/10 ring-2 ring-primary/30",
				)}
				onDragEnter={handleDragEnter}
				onDragLeave={handleDragLeave}
				onDragOver={event => event.preventDefault()}
				onDrop={handleDrop}
			>
				{isDragging && (
					<div
						aria-hidden
						className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center gap-2 rounded-md bg-primary/10 font-semibold text-primary text-sm"
					>
						<LuImageUp className="size-5" />
						{dropLabel}
					</div>
				)}
				<Input
					className={
						localValue
							? "border-0 pr-22 shadow-none focus-visible:ring-0"
							: "border-0 pr-11 shadow-none focus-visible:ring-0"
					}
					onBlur={flushValue}
					onChange={event => setLocalValue(event.currentTarget.value)}
					placeholder={placeholder}
					value={localValue}
				/>
				<input
					accept={acceptByAsset[asset]}
					className="hidden"
					onChange={event => {
						const file = event.currentTarget.files?.[0];
						if (file) void upload(file);
						event.currentTarget.value = "";
					}}
					ref={fileInputRef}
					type="file"
				/>
				{localValue && (
					<button
						aria-label={isImageAsset ? "Remover imagem" : "Remover fonte"}
						className="absolute inset-y-0 right-11 flex w-11 items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
						disabled={isUploading || isDeleting}
						onClick={() => void removeImage()}
						title={isImageAsset ? "Remover imagem" : "Remover fonte"}
						type="button"
					>
						<LuTrash2 className="size-4" />
					</button>
				)}
				<button
					aria-label={uploadLabel}
					className="absolute inset-y-0 right-0 flex w-11 items-center justify-center bg-transparent text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
					disabled={isUploading || isDeleting}
					onClick={() => fileInputRef.current?.click()}
					title={uploadLabel}
					type="button"
				>
					{isUploading ? <LuLoaderCircle className="size-4 animate-spin" /> : <LuUpload className="size-4" />}
				</button>
			</div>
			{dimensionHint && <p className="text-muted-foreground text-xs">{dimensionHint}</p>}
			{preview && isImageAsset && localValue && (
				<figure
					className={cn(
						"relative flex min-h-30 w-full max-w-sm flex-col overflow-hidden rounded-md border border-border bg-muted/30",
						previewClassName,
					)}
				>
					<img alt="" className="h-24 min-h-0 w-full flex-1 object-contain" src={localValue} />
					<figcaption className="border-border border-t bg-card/90 px-2 py-1 text-muted-foreground text-xs">
						{t("media.preview")}
					</figcaption>
				</figure>
			)}
		</div>
	);
}
