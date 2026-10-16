import { useState } from "react";
import { NumericFormat } from "react-number-format";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/Checkbox";
import { CustomSelect } from "@/components/ui/CustomSelect";
import { Input } from "@/components/ui/input";
import { Label, RequiredMark } from "@/components/ui/label";
import { useDebouncedInput } from "@/hooks/use-debounced-input";
import type { FeeFormValue } from "./types";

interface FeeFormProps {
	initial?: FeeFormValue;
	isPending: boolean;
	lockKind?: boolean;
	onCancel?: () => void;
	onSubmit: (value: FeeFormValue) => void;
}

const defaults: FeeFormValue = {
	active: true,
	applicationScope: "product",
	calculationType: "percentage",
	displayMode: "checkout_only",
	name: "",
	value: 0,
};

export function FeeForm({ initial = defaults, isPending, lockKind = false, onCancel, onSubmit }: FeeFormProps) {
	const [form, setForm] = useState(initial);
	const [name, setName] = useDebouncedInput(form.name, value => setForm(current => ({ ...current, name: value })));
	const displayOptions = form.applicationScope === "order"
		? [{ label: "Somente no checkout", value: "checkout_only" }]
		: [
				{ label: "Explícita no produto", value: "product_explicit" },
				{ label: "Embutida no preço", value: "embedded" },
				{ label: "Somente no checkout", value: "checkout_only" },
			];

	return (
		<form className="space-y-4" onSubmit={event => { event.preventDefault(); onSubmit({ ...form, name }); }}>
			<Label>
				<span>Nome <RequiredMark /></span>
				<Input name="fee-name" onChange={event => setName(event.currentTarget.value)} placeholder="Ex: Taxa de serviço" required type="text" value={name} />
			</Label>
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
				<div className="space-y-2">
					<p className="font-medium text-sm">Cálculo</p>
					<CustomSelect disabled={lockKind} onChange={value => setForm(current => ({ ...current, calculationType: value as FeeFormValue["calculationType"] }))} options={[{ label: "Percentual", value: "percentage" }, { label: "Valor fixo", value: "fixed" }]} value={form.calculationType} />
				</div>
			</div>
			<Label>
				<span>Valor <RequiredMark /></span>
				<NumericFormat
					allowNegative={false}
					className="flex h-11 w-full rounded-md border border-input bg-surface px-3 py-2 text-sm placeholder:text-muted-foreground/70"
					decimalScale={form.calculationType === "percentage" ? 2 : 2}
					decimalSeparator=","
					isAllowed={({ floatValue }) => floatValue === undefined || (floatValue > 0 && (form.calculationType !== "percentage" || floatValue <= 100))}
					name="fee-value"
					onValueChange={({ floatValue }) => setForm(current => ({ ...current, value: Math.round((floatValue ?? 0) * (current.calculationType === "percentage" ? 100 : 100)) }))}
					placeholder={form.calculationType === "percentage" ? "Ex: 2,00%" : "Ex: R$ 2,00"}
					prefix={form.calculationType === "fixed" ? "R$ " : undefined}
					suffix={form.calculationType === "percentage" ? "%" : undefined}
					thousandSeparator="."
					value={form.value / 100}
				/>
			</Label>
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
			<div className="flex justify-end gap-2">
				{onCancel && <Button onClick={onCancel} type="button" variant="outline">Descartar</Button>}
				<Button disabled={isPending || !name.trim() || form.value <= 0} type="submit">Salvar</Button>
			</div>
		</form>
	);
}
