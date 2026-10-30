import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/Checkbox";
import { CollapsibleFormSection } from "@/components/ui/CollapsibleFormSection";
import { CustomSelect } from "@/components/ui/CustomSelect";
import { Input } from "@/components/ui/input";
import { Label, RequiredMark } from "@/components/ui/label";
import { useDebouncedInput } from "@/hooks/use-debounced-input";
import { FeeValueInput } from "./FeeValueInput";
import type { FeeFormValue } from "./types";

interface FeeFormProps {
	collapsible?: boolean;
	initial?: FeeFormValue;
	isPending: boolean;
	lockKind?: boolean;
	onCancel?: () => void;
	onSubmit: (value: FeeFormValue) => void;
}

const defaults: FeeFormValue = {
	active: true,
	applicationScope: "product",
	displayMode: "checkout_only",
	fixedValue: 0,
	name: "",
	percentageValue: 0,
};

export function FeeForm({ collapsible = false, initial = defaults, isPending, lockKind = false, onCancel, onSubmit }: FeeFormProps) {
	const [form, setForm] = useState(initial);
	const [name, setName] = useDebouncedInput(form.name, value => setForm(current => ({ ...current, name: value })));
	const hasData = useMemo(
		() => !!name || Object.entries(defaults).some(([key, value]) => form[key as keyof FeeFormValue] !== value),
		[form, name],
	);
	const displayOptions = form.applicationScope === "order"
		? [{ label: "Somente no checkout", value: "checkout_only" }]
		: [
				{ label: "Explícita no produto", value: "product_explicit" },
				{ label: "Embutida no preço", value: "embedded" },
				{ label: "Somente no checkout", value: "checkout_only" },
			];

	return (
		<form className="group space-y-4" onSubmit={event => { event.preventDefault(); onSubmit({ ...form, name }); }}>
			<Label>
				<span>Nome <RequiredMark /></span>
				<Input name="fee-name" onChange={event => setName(event.currentTarget.value)} placeholder="Ex: Taxa de serviço" required type="text" value={name} />
			</Label>
			<CollapsibleFormSection expanded={!collapsible || hasData}>
				<div className="grid gap-4 sm:grid-cols-2">
					<div className="space-y-2">
						<p className="font-medium text-sm">Aplicação</p>
						<CustomSelect
							disabled={lockKind}
							onChange={value => setForm(current => ({
								...current,
								applicationScope: value as FeeFormValue["applicationScope"],
								displayMode: value === "order" ? "checkout_only" : current.displayMode,
							}))}
							options={[{ label: "Por produto", value: "product" }, { label: "Por pedido", value: "order" }]}
							value={form.applicationScope}
						/>
					</div>
				</div>
				<div className="grid gap-4 sm:grid-cols-2">
					<Label>
						<span>Percentual</span>
						<FeeValueInput kind="percentage" name="fee-percentage" onChange={percentageValue => setForm(current => ({ ...current, percentageValue }))} value={form.percentageValue} />
					</Label>
					<Label>
						<span>Valor fixo</span>
						<FeeValueInput kind="fixed" name="fee-fixed" onChange={fixedValue => setForm(current => ({ ...current, fixedValue }))} value={form.fixedValue} />
					</Label>
				</div>
				<p className="text-muted-foreground text-xs">Informe um ou ambos. Ex: 4% + R$ 1,00.</p>
				<div className="space-y-2">
					<p className="font-medium text-sm">Exibição</p>
					<CustomSelect onChange={value => setForm(current => ({ ...current, displayMode: value as FeeFormValue["displayMode"] }))} options={displayOptions} value={form.displayMode} />
				</div>
				<label className="flex cursor-pointer items-center gap-2 text-sm" htmlFor="fee-active">
					<Checkbox checked={form.active} id="fee-active" onChange={event => {
						const active = event.currentTarget.checked;
						setForm(current => ({ ...current, active }));
					}} />
					Taxa ativa
				</label>
			</CollapsibleFormSection>
			<div className="flex justify-end gap-2">
				{onCancel && <Button onClick={onCancel} type="button" variant="outline">Descartar</Button>}
				<Button disabled={isPending || !name.trim() || (form.percentageValue <= 0 && form.fixedValue <= 0)} type="submit">Salvar</Button>
			</div>
		</form>
	);
}
