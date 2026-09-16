import { useQueryClient } from "@tanstack/react-query";
import { Modal } from "@/components/ui/Modal";
import { DataTable } from "@/components/ui/DataTable";
import { ErrorState } from "@/components/ui/ErrorState";
import {
	deletePlatformFeesByFeeIdCompaniesByCompanyId,
	getPlatformFeesByFeeIdCompaniesQueryKey,
	putPlatformFeesByFeeIdCompaniesByCompanyId,
	useGetPlatformFeesByFeeIdCompanies,
} from "@/lib/api";
import { Skeleton } from "@/components/ui/Skeleton";
import { showAlert, showToast } from "@/stores";
import { CompanyOverrideRow } from "./CompanyOverrideRow";
import type { PlatformFee } from "./types";

interface CompanyOverridesModalProps {
	fee: PlatformFee | null;
	onClose: () => void;
}

export function CompanyOverridesModal({ fee, onClose }: CompanyOverridesModalProps) {
	const queryClient = useQueryClient();
	const query = useGetPlatformFeesByFeeIdCompanies(fee?.id ?? "", { query: { enabled: !!fee } });
	if (!fee) return null;
	const refresh = () => queryClient.invalidateQueries({ queryKey: getPlatformFeesByFeeIdCompaniesQueryKey(fee.id) });

	async function save(companyId: string, active: boolean, valueOverride: number | null) {
		try {
			await putPlatformFeesByFeeIdCompaniesByCompanyId(fee!.id, companyId, { active, valueOverride });
			await refresh();
			showToast("Sobrescrita salva.", "positive");
		} catch { void showAlert("Não foi possível salvar a sobrescrita."); }
	}

	async function reset(companyId: string) {
		try {
			await deletePlatformFeesByFeeIdCompaniesByCompanyId(fee!.id, companyId);
			await refresh();
			showToast("Padrão global restaurado.", "info");
		} catch { void showAlert("Não foi possível restaurar o padrão."); }
	}

	return (
		<Modal isOpen onClose={onClose} title={`Empresas — ${fee.name}`} urlKey="platform-fee-companies" urlState={fee.id}>
			<p className="mb-4 text-muted-foreground text-sm">Valor vazio herda {fee.calculationType === "fixed" ? "o valor fixo" : "o percentual"} global.</p>
			{query.isPending ? <Skeleton className="h-48 w-full" /> : query.isError ? <ErrorState title="Erro ao carregar empresas" /> : <DataTable>
				<thead><tr className="border-border border-b text-left text-muted-foreground"><th className="px-3 py-2">Empresa</th><th className="px-3 py-2">Valor próprio</th><th className="px-3 py-2 text-center">Ativa</th><th className="px-3 py-2" /></tr></thead>
				<tbody>{query.data?.map(company => <CompanyOverrideRow calculationType={fee.calculationType as "fixed" | "percentage"} company={company} key={company.companyId} onReset={companyId => void reset(companyId)} onSave={(...args) => void save(...args)} />)}</tbody>
			</DataTable>}
		</Modal>
	);
}
