import { useId } from "react";
import { useTranslation } from "react-i18next";
import { Checkbox } from "@/components/ui/Checkbox";

interface MenuTaxesFieldProps {
	checked: boolean;
	disabled?: boolean;
	onChange: (checked: boolean) => void;
}

export function MenuTaxesField({ checked, disabled = false, onChange }: MenuTaxesFieldProps) {
	const { t } = useTranslation();
	const id = useId();
	return (
		<label className="flex cursor-pointer items-center gap-3 text-sm" htmlFor={id}>
			<Checkbox disabled={disabled} checked={checked} id={id} onChange={event => onChange(event.currentTarget.checked)} />
			{t("admin.unitProducts.export.includeTaxes")}
		</label>
	);
}
