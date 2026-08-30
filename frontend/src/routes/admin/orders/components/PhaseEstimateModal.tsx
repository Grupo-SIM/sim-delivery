import { NumericFormat } from "react-number-format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/Modal";
import { useDebouncedInput } from "@/hooks/use-debounced-input";

interface PhaseEstimateModalProps {
	isOpen: boolean;
	isPending: boolean;
	onClose: () => void;
	onConfirm: (minutes?: number) => void;
	orderId?: string;
	status: "em_preparo" | "saiu_para_entrega";
}

export function PhaseEstimateModal({
	isOpen,
	isPending,
	onClose,
	onConfirm,
	orderId,
	status,
}: PhaseEstimateModalProps) {
	const [minutes, setMinutes] = useDebouncedInput("15", () => undefined);
	const parsedMinutes = Number.parseInt(minutes, 10);
	const isValid = Number.isInteger(parsedMinutes) && parsedMinutes >= 1 && parsedMinutes <= 1440;
	const phaseLabel = status === "em_preparo" ? "preparo" : "entrega";

	return (
		<Modal
			isOpen={isOpen}
			maxWidth="480px"
			onClose={onClose}
			title={`Estimar tempo de ${phaseLabel}`}
			urlKey="order-phase-estimate"
			urlState={orderId ? `${orderId}:${status}` : undefined}
		>
			<div className="space-y-5">
				<p className="text-muted-foreground text-sm">
					Informe em quanto tempo esta fase deve terminar ou avance sem estimativa. Cliente verá horário
					previsto quando informado.
				</p>
				<label className="space-y-1.5">
					<span className="font-medium text-sm">Tempo estimado (opcional)</span>
					<NumericFormat
						allowNegative={false}
						customInput={Input}
						decimalScale={0}
						inputMode="numeric"
						name="estimatedMinutes"
						onValueChange={({ value }) => setMinutes(value)}
						placeholder="Ex: 15 min"
						suffix=" min"
						value={minutes}
					/>
				</label>
				<div className="flex flex-wrap justify-end gap-2">
					<Button onClick={() => window.history.back()} type="button" variant="outline">
						Descartar
					</Button>
					<Button disabled={isPending} onClick={() => onConfirm()} type="button" variant="outline">
						Sem estimativa
					</Button>
					<Button
						disabled={!isValid || isPending}
						onClick={() => onConfirm(parsedMinutes)}
						type="button"
					>
						{isPending ? "Atualizando..." : "Confirmar mudança"}
					</Button>
				</div>
			</div>
		</Modal>
	);
}
