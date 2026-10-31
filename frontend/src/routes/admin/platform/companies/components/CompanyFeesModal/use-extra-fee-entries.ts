import { useMemo } from "react";
import { type CompanyAdditiveFee, type ExtraFeeDraft, percentToBasisPoints, reaisToNullableCents } from "./types";

/** SimIntPay catalog joined with this company's association, honoring unsaved drafts. */
export function useExtraFeeEntries(additiveFees: CompanyAdditiveFee[], drafts: Record<string, ExtraFeeDraft>) {
	return useMemo(
		() =>
			additiveFees.map(fee => {
				const draft = drafts[fee.id];
				const active = draft ? draft.active : fee.associated;
				const percentage = draft ? (draft.reset ? null : percentToBasisPoints(draft.percentage)) : fee.percentageOverride;
				const fixed = draft ? (draft.reset ? null : reaisToNullableCents(draft.fixed)) : fee.fixedOverride;
				return {
					active,
					draft,
					fee,
					fixedCents: Number(fixed ?? fee.fixedValue),
					ratePpm: Number(percentage ?? fee.percentageValue) * 100,
				};
			}),
		[additiveFees, drafts],
	);
}
