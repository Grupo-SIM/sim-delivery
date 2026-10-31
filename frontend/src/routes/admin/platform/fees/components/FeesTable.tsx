import { useQueryClient } from "@tanstack/react-query";
import { LuBuilding2, LuPencil, LuTrash2 } from "react-icons/lu";
import { Button } from "@/components/ui/button";
import { ConfirmActionButton } from "@/components/ui/ConfirmActionButton";
import { DataTable } from "@/components/ui/DataTable";
import { EmptyState } from "@/components/ui/EmptyState";
import { Tooltip } from "@/components/ui/Tooltip";
import { deletePlatformFeesByFeeId } from "@/lib/api";
import { formatFeeAmount } from "@/lib/platform-fees";
import { showAlert, showToast } from "@/stores";
import type { PlatformFee } from "./types";

interface FeesTableProps {
	fees: PlatformFee[];
	onCompanies: (fee: PlatformFee) => void;
	onEdit: (fee: PlatformFee) => void;
}

export function FeesTable({ fees, onCompanies, onEdit }: FeesTableProps) {
	const queryClient = useQueryClient();
	if (fees.length === 0) return <EmptyState title="Nenhuma taxa cadastrada" />;

	async function remove(fee: PlatformFee) {
		try {
			await deletePlatformFeesByFeeId(fee.id);
			await queryClient.invalidateQueries({ queryKey: ["Platform Fees"] });
			showToast("Taxa excluída.", "positive");
		} catch { void showAlert("Não foi possível excluir a taxa."); }
	}

	return (
		<DataTable>
			<thead><tr className="border-border border-b text-left text-muted-foreground"><th className="px-4 py-3">Nome</th><th className="px-4 py-3">Aplicação</th><th className="px-4 py-3">Valor</th><th className="px-4 py-3">Exibição</th><th className="px-4 py-3" /></tr></thead>
			<tbody>{fees.map(fee => (
				<tr className="border-border border-b last:border-0" key={fee.id}>
					<td className="px-4 py-3 font-medium">{fee.name}</td>
					<td className="px-4 py-3">{fee.applicationScope === "product" ? "Por produto" : "Por pedido"}</td>
					<td className="px-4 py-3">{formatFeeAmount(fee.percentageValue, fee.fixedValue)}</td>
					<td className="px-4 py-3">{{ checkout_only: "Checkout", embedded: "Embutida", product_explicit: "Explícita" }[fee.displayMode]}</td>
					<td className="px-4 py-3"><div className="flex justify-end gap-2">
						<Tooltip content="Empresas"><Button aria-label="Empresas" onClick={() => onCompanies(fee)} size="icon" type="button" variant="outline"><LuBuilding2 /></Button></Tooltip>
						<Tooltip content="Editar"><Button aria-label="Editar" onClick={() => onEdit(fee)} size="icon" type="button" variant="outline"><LuPencil /></Button></Tooltip>
						<ConfirmActionButton aria-label="Excluir" confirmation={`Excluir ${fee.name}?`} confirmLabel="Excluir" idleIcon={<LuTrash2 />} onConfirm={() => void remove(fee)} size="icon" tooltip="Excluir" type="button" variant="outline"><span className="sr-only">Excluir</span></ConfirmActionButton>
					</div></td>
				</tr>
			))}</tbody>
		</DataTable>
	);
}
