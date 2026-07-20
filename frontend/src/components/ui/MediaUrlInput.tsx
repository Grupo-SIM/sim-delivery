import { useRef, useState } from "react";
import { LuLoaderCircle, LuUpload } from "react-icons/lu";
import { useDebouncedInput } from "@/hooks/use-debounced-input";
import { type MediaAsset, uploadMedia } from "@/lib/api";
import { Input } from "./input";

const acceptByAsset: Record<MediaAsset, string> = {
	banner: "image/avif,image/jpeg,image/png,image/webp",
	"font-display": ".otf,.ttf,.woff,.woff2,font/otf,font/ttf,font/woff,font/woff2",
	"font-family": ".otf,.ttf,.woff,.woff2,font/otf,font/ttf,font/woff,font/woff2",
	logo: "image/avif,image/jpeg,image/png,image/webp",
	product: "image/avif,image/jpeg,image/png,image/webp",
	promotion: "image/avif,image/jpeg,image/png,image/webp",
	unit: "image/avif,image/jpeg,image/png,image/webp",
};

interface MediaUrlInputProps {
	asset: MediaAsset;
	onUploadError: () => void;
	onUploadingChange?: (isUploading: boolean) => void;
	onValueChange: (value: string) => void;
	uploadLabel: string;
	value: string;
}

export function MediaUrlInput({
	asset,
	onUploadError,
	onUploadingChange,
	onValueChange,
	uploadLabel,
	value,
}: MediaUrlInputProps) {
	const fileInputRef = useRef<HTMLInputElement>(null);
	const [isUploading, setIsUploading] = useState(false);
	const [localValue, setLocalValue, flushValue] = useDebouncedInput(value, onValueChange);

	async function upload(file: File) {
		setIsUploading(true);
		onUploadingChange?.(true);
		try {
			onValueChange(await uploadMedia(asset, file));
		} catch {
			onUploadError();
		} finally {
			setIsUploading(false);
			onUploadingChange?.(false);
		}
	}

	return (
		<div className="relative">
			<Input
				className="pr-11"
				onBlur={flushValue}
				onChange={event => setLocalValue(event.currentTarget.value)}
				placeholder="Envie um arquivo ou cole uma URL"
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
			<button
				aria-label={uploadLabel}
				className="absolute inset-y-0 right-0 flex w-11 items-center justify-center bg-transparent text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
				disabled={isUploading}
				onClick={() => fileInputRef.current?.click()}
				title={uploadLabel}
				type="button"
			>
				{isUploading ? <LuLoaderCircle className="size-4 animate-spin" /> : <LuUpload className="size-4" />}
			</button>
		</div>
	);
}
