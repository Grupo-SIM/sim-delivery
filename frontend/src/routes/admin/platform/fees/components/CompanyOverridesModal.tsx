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
import { CompanyOverrideRow, type FeeOverrideValues } from "./CompanyOverrideRow";
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

	async function save(companyId: string, values: FeeOverrideValues) {
		try {
			await putPlatformFeesByFeeIdCompaniesByCompanyId(fee!.id, companyId, values);
			await refresh();
			showToast("Sobrescrita salva.", "positive");
			return true;
		} catch {
			void showAlert("Não foi possível salvar a sobrescrita.");
			return false;
		}
	}

	async function reset(companyId: string) {
		try {
			await deletePlatformFeesByFeeIdCompaniesByCompanyId(fee!.id, companyId);
			const result = await query.refetch();
			showToast("Padrão global restaurado.", "info");
			return result.data?.find(company => company.companyId === companyId);
		} catch { void showAlert("Não foi possível restaurar o padrão."); }
	}

	return (
		<Modal isOpen onClose={onClose} title={`Empresas — ${fee.name}`} urlKey="platform-fee-companies" urlState={fee.id}>
			<p className="mb-4 text-muted-foreground text-sm">Campo vazio herda o valor global.</p>
			{query.isPending ? <Skeleton className="h-48 w-full" /> : query.isError ? <ErrorState title="Erro ao carregar empresas" /> : <DataTable tableClassName="min-w-0 table-fixed">
				<colgroup><col /><col className="w-[40%]" /><col className="w-14 sm:w-20" /><col className="w-16" /></colgroup>
				<thead><tr className="border-border border-b text-left text-muted-foreground"><th className="px-3 py-2">Empresa</th><th className="px-3 py-2">Percentual</th><th className="px-3 py-2">Valor fixo</th><th className="px-3 py-2 text-center">Ativa</th><th className="px-3 py-2" /></tr></thead>
				<tbody>{query.data?.map(company => <CompanyOverrideRow company={company} key={company.companyId} onReset={reset} onSave={save} />)}</tbody>
			</DataTable>}
		</Modal>
	);
}
