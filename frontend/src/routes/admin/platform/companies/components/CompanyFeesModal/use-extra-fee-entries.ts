import { useQueries } from "@tanstack/react-query";
import { getPlatformFeesByFeeIdCompaniesQueryOptions, useGetPlatformFees } from "@/lib/api";
import { type ExtraFeeDraft, percentToBasisPoints, reaisToNullableCents } from "./types";

/** Platform fees joined with this company's association, honoring unsaved drafts. */
export function useExtraFeeEntries(companyId: string, drafts: Record<string, ExtraFeeDraft>) {
	const query = useGetPlatformFees();
	const fees = query.data ?? [];
	const associations = useQueries({ queries: fees.map(fee => getPlatformFeesByFeeIdCompaniesQueryOptions(fee.id)) });
	const entries = fees.map((fee, index) => {
		const association = associations[index]?.data?.find(company => company.companyId === companyId);
		const draft = drafts[fee.id];
		const active = draft ? (draft.reset ? fee.active : draft.active) : (association?.active ?? false);
		const percentage = draft ? (draft.reset ? null : percentToBasisPoints(draft.percentage)) : association?.percentageOverride;
		const fixed = draft ? (draft.reset ? null : reaisToNullableCents(draft.fixed)) : association?.fixedOverride;
		return {
			active,
			association,
			draft,
			fee,
			fixedCents: Number(fixed ?? fee.fixedValue),
			ratePpm: Number(percentage ?? fee.percentageValue) * 100,
		};
	});
	return {
		entries,
		isError: query.isError || associations.some(association => association.isError),
		isPending: query.isPending || associations.some(association => association.isPending),
	};
}
