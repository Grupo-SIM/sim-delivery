import { useDebouncedInput } from "@/hooks/use-debounced-input";
import { Input } from "@/components/ui/input";
import { Label, RequiredMark } from "@/components/ui/label";

export function MerchantDocumentField({ value, onChange }: { value: string; onChange: (value: string) => void }) {
	const [local, setLocal, flush] = useDebouncedInput(value, onChange);
	const digits = local.replace(/\D/g, "").slice(0, 14);
	const pattern = digits.length <= 11 ? "###.###.###-##" : "##.###.###/####-##";
	let index = 0;
	let masked = "";
	for (const char of pattern) {
		if (index >= digits.length) break;
		masked += char === "#" ? digits[index++] : char;
	}
	return <Label><span>CPF ou CNPJ <RequiredMark /></span><Input inputMode="numeric" name="company-document" onBlur={() => flush()} onChange={event => setLocal(event.currentTarget.value.replace(/\D/g, "").slice(0, 14))} placeholder="Ex: 529.982.247-25 ou 10.802.530/0001-07" type="text" value={masked} /></Label>;
}
