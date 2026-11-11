import { closeActiveModalHistory } from "@/hooks/use-modal-history";
import { NumericFormat } from "react-number-format";
import { LuClock3, LuTimerOff } from "react-icons/lu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/Modal";
import { useDebouncedInput } from "@/hooks/use-debounced-input";

interface PhaseEstimateModalProps {
	isOpen: boolean;
	isPending: boolean;
	initialMinutes?: number;
	onClose: () => void;
	onConfirm: (minutes?: number) => void;
	orderId?: string;
	status: "em_preparo";
}

export function PhaseEstimateModal({
	isOpen,
	isPending,
	initialMinutes = 15,
	onClose,
	onConfirm,
	orderId,
	status,
}: PhaseEstimateModalProps) {
	const [minutes, setMinutes] = useDebouncedInput(String(initialMinutes), () => undefined);
	const parsedMinutes = Number.parseInt(minutes, 10);
	const isValid = Number.isInteger(parsedMinutes) && parsedMinutes >= 1 && parsedMinutes <= 1440;

	return (
		<Modal
			isOpen={isOpen}
			layer="submodal"
			maxWidth="520px"
			onClose={onClose}
			title={
				<span className="flex items-center gap-3">
					<span className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary">
						<LuClock3 className="size-5" />
					</span>
					<span>Estimar tempo de preparo</span>
				</span>
			}
			urlKey="order-phase-estimate"
			urlState={orderId ? `${orderId}:${status}` : undefined}
		>
			<div className="space-y-6">
				<p className="max-w-md text-muted-foreground text-sm leading-6">
					Defina quando esta etapa deve terminar. Cliente verá a previsão de horário no acompanhamento do pedido.
				</p>
				<div className="rounded-xl border bg-muted/30 p-4">
					<label className="block space-y-2">
						<span className="font-semibold text-sm">Tempo estimado</span>
						<NumericFormat
							allowNegative={false}
							customInput={Input}
							decimalScale={0}
							inputMode="numeric"
							name="estimatedMinutes"
							onValueChange={({ value }) => setMinutes(value)}
							placeholder="Ex.: 15"
							suffix=" min"
							value={minutes}
						/>
					</label>
					<div className="mt-3 flex flex-wrap gap-2" aria-label="Sugestões de tempo">
						{[15, 30, 45, 60].map(value => (
							<Button
								className="h-8 min-w-12 px-2 text-xs"
								key={value}
								onClick={() => setMinutes(String(value))}
								type="button"
								variant={minutes === String(value) ? "default" : "outline"}
							>
								{value} min
							</Button>
						))}
					</div>
				</div>
				<div className="flex flex-col-reverse gap-2 border-t pt-5 sm:flex-row sm:items-center sm:justify-between">
					<Button className="sm:self-start" onClick={() => closeActiveModalHistory()} type="button" variant="outline">
						Cancelar
					</Button>
					<div className="grid gap-2 sm:flex">
						<Button disabled={isPending} onClick={() => onConfirm()} type="button" variant="outline">
							<LuTimerOff className="size-4" />
							Sem estimativa
						</Button>
						<Button
							disabled={!isValid || isPending}
							onClick={() => onConfirm(parsedMinutes)}
							type="button"
						>
							{isPending ? "Atualizando..." : "Confirmar previsão"}
						</Button>
					</div>
				</div>
			</div>
		</Modal>
	);
}
