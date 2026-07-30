import { useState, type MutableRefObject } from "react";
import { useTranslation } from "react-i18next";
import { Checkbox } from "@/components/ui/Checkbox";
import { Input } from "@/components/ui/input";
import { Label, RequiredMark } from "@/components/ui/label";
import { MediaUrlInput } from "@/components/ui/MediaUrlInput";
import { NumericInput } from "@/components/ui/NumericInput";
import { useDebouncedInput } from "@/hooks/use-debounced-input";
import type { EditableOption } from "./OptionEditor";

interface OptionFormFieldsProps {
	draftRef?: MutableRefObject<EditableOption>;
	onChange: (option: EditableOption) => void;
	option: EditableOption;
}

export function OptionFormFields({ draftRef, onChange, option }: OptionFormFieldsProps) {
	const { t } = useTranslation();
	const [name, setName] = useState(option.name);
	const [localName, setLocalName, flushName] = useDebouncedInput(name, setName);
	const [description, setDescription] = useState(option.description);
	const [localDescription, setLocalDescription, flushDescription] = useDebouncedInput(
		description,
		setDescription,
	);
	const [imageUrl, setImageUrl] = useState(option.imageUrl ?? "");
	const update = (patch: Partial<EditableOption>) => {
		const value = { ...(draftRef?.current ?? option), ...patch };
		if (draftRef) draftRef.current = value;
		onChange(value);
	};

	return (
		<>
			<Label className="min-w-0">
				<span>
					{t("admin.products.options.optionName")} <RequiredMark />
				</span>
				<Input
					onBlur={() => {
						flushName();
						update({ name: localName });
					}}
					onChange={event => {
						const name = event.currentTarget.value;
						if (draftRef) draftRef.current = { ...draftRef.current, name };
						setLocalName(name);
					}}
					placeholder={t("admin.products.options.optionPlaceholder")}
					required
					value={localName}
				/>
			</Label>
			<Label className="min-w-0">
				<span>{t("admin.products.options.optionDescription")}</span>
				<Input
					onBlur={() => {
						flushDescription();
						update({ description: localDescription });
					}}
					onChange={event => {
						const description = event.currentTarget.value;
						if (draftRef) draftRef.current = { ...draftRef.current, description };
						setLocalDescription(description);
					}}
					placeholder={t("admin.products.options.descriptionPlaceholder")}
					value={localDescription}
				/>
			</Label>
			<Label className="min-w-0">
				<span>{t("admin.products.options.optionImage")}</span>
				<MediaUrlInput
					asset="product"
					onUploadError={() => undefined}
					onValueChange={value => {
						setImageUrl(value);
						update({ imageUrl: value || null });
					}}
					uploadLabel={t("admin.products.options.optionImage")}
					value={imageUrl}
				/>
			</Label>
			<Label>
				<span>{t("admin.products.options.priceDelta")}</span>
				<NumericInput
					decimalScale={2}
					decimalSeparator=","
					onValueChange={({ floatValue }) => update({ priceDeltaCents: Math.round((floatValue ?? 0) * 100) })}
					placeholder="R$ 2,50"
					prefix="R$ "
					thousandSeparator="."
					value={option.priceDeltaCents / 100}
				/>
			</Label>
			<div className="flex items-center gap-2 text-sm">
				<Checkbox
					checked={option.available}
					id={`option-${option.id}-available`}
					onChange={event => update({ available: event.currentTarget.checked })}
				/>
				<label className="cursor-pointer" htmlFor={`option-${option.id}-available`}>
					{t("admin.products.options.available")}
				</label>
			</div>
		</>
	);
}
