import { TextField } from "@/components/ui/TextField";
import { useGoogleFont } from "@/hooks/use-google-font";

interface FontFieldProps {
	label: string;
	onValueChange: (value: string) => void;
	placeholder: string;
	previewLabel: string;
	sampleClassName?: string;
	sampleText: string;
	value: string;
}

export function FontField({
	label,
	onValueChange,
	placeholder,
	previewLabel,
	sampleClassName,
	sampleText,
	value,
}: FontFieldProps) {
	useGoogleFont(value);

	return (
		<div className="space-y-3">
			<TextField label={label} onValueChange={onValueChange} placeholder={placeholder} value={value} />

			{value && (
				<div className="rounded border border-border p-3">
					<p className="mb-2 font-medium text-muted-foreground text-xs uppercase">{previewLabel}</p>
					<p className={sampleClassName} style={{ fontFamily: `"${value}", sans-serif` }}>
						{sampleText}
					</p>
				</div>
			)}
		</div>
	);
}
