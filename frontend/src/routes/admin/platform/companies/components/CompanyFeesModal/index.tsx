import { useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { CustomSelect } from "@/components/ui/CustomSelect";
import { ErrorState } from "@/components/ui/ErrorState";
import { Modal } from "@/components/ui/Modal";
import { Skeleton } from "@/components/ui/Skeleton";
import {
	deletePlatformFeesByFeeIdCompaniesByCompanyId,
	getPlatformFeesByCompanyByCompanyIdQueryKey,
	getPlatformFeesByFeeIdCompaniesQueryKey,
	getPlatformFeesUnderCoveredCompaniesQueryKey,
	putPlatformFeesByCompanyByCompanyId,
	putPlatformFeesByFeeIdCompaniesByCompanyId,
	useGetPlatformFeesByCompanyByCompanyId,
	useGetPlatformFeesByCompanyDefaults,
} from "@/lib/api";
import { showAlert, showToast } from "@/stores";
import { ExtraFeesList } from "./ExtraFeesList";
import { overriddenSurcharge } from "./overridden-fee-lines";
import { OverriddenFeesList } from "./OverriddenFeesList";
import { SimintpayLaneRow, initialDraft } from "./SimintpayLaneRow";
import { useExtraFeeEntries } from "./use-extra-fee-entries";
import { type CompanyFees, type FeeMode, type ExtraFeeDraft, type LaneDraft, compareLanes, laneId, percentToBasisPoints, percentToPpm, reaisToCents, reaisToNullableCents } from "./types";

interface CompanyFeesModalProps {
	companyId: string;
	companyName: string;
	isOpen: boolean;
	onClose: () => void;
}

const MODES: FeeMode[] = ["ADDITIVE_ONLY", "SIMINTPAY_ONLY", "BOTH"];

function FeesEditor({ fees, companyId }: { companyId: string; fees: CompanyFees }) {
	const { t } = useTranslation();
	const queryClient = useQueryClient();
	const [mode, setMode] = useState<FeeMode>(fees.mode);
	const [drafts, setDrafts] = useState<Record<string, LaneDraft>>(() =>
		Object.fromEntries(fees.simintpay.lanes.map(lane => [laneId(lane), initialDraft(lane)])),
	);
	const [disabledLanes, setDisabledLanes] = useState<Set<string>>(() => new Set(fees.disabledLanes));
	const [extraDrafts, setExtraDrafts] = useState<Record<string, ExtraFeeDraft>>({});
	const [saving, setSaving] = useState(false);
	const lanes = useMemo(() => [...fees.simintpay.lanes].sort(compareLanes), [fees.simintpay.lanes]);
	const orderedLanes = useMemo(
		() => [...lanes].sort((a, b) => Number(disabledLanes.has(laneId(a))) - Number(disabledLanes.has(laneId(b)))),
		[disabledLanes, lanes],
	);
	const { data: defaults } = useGetPlatformFeesByCompanyDefaults();
	const globalDefaults = useMemo(() => new Map(defaults?.lanes.map(lane => [laneId(lane), lane])), [defaults]);
	const coverage = useMemo(() => new Map(fees.coverage.map(lane => [laneId(lane), lane])), [fees.coverage]);

	const { entries: extraEntries } = useExtraFeeEntries(companyId, extraDrafts);
	const overridden = fees.additiveOverride != null;
	// Associating a fee over the SimIntPay total hands the total back to Delivery on save.
	const associating = overridden && Object.values(extraDrafts).some(draft => draft.active && !draft.reset);
	const surcharge = useMemo(() => {
		// Until a fee is associated, SimIntPay's total is what the seller is charged, whatever the drafts say.
		if (overridden && !associating) return mode === "SIMINTPAY_ONLY" ? { fixedCents: 0, ratePpm: 0 } : overriddenSurcharge(fees.additiveOverride);
		const active = mode === "SIMINTPAY_ONLY" ? [] : extraEntries.filter(entry => entry.active);
		return { fixedCents: active.reduce((sum, entry) => sum + entry.fixedCents, 0), ratePpm: active.reduce((sum, entry) => sum + entry.ratePpm, 0) };
	}, [associating, extraEntries, fees.additiveOverride, mode, overridden]);

	const underCovered = lanes.some(lane => {
		const id = laneId(lane);
		if (disabledLanes.has(id)) return false;
		const cost = coverage.get(id)?.cost;
		if (!cost) return false;
		const draft = drafts[id] ?? initialDraft(lane);
		const ratePpm = surcharge.ratePpm + (mode === "ADDITIVE_ONLY" ? 0 : percentToPpm(draft.rate));
		const fixedCents = surcharge.fixedCents + (mode === "ADDITIVE_ONLY" ? 0 : reaisToCents(draft.fixed));
		return ratePpm < Number(cost.ratePpm) || fixedCents < Number(cost.fixedCents);
	});

	async function save() {
		setSaving(true);
		try {
			// Release first: while overridden, Delivery undoes any association it sees.
			if (associating) await putPlatformFeesByCompanyByCompanyId(companyId, { releaseAdditiveOverride: true });
			await Promise.all(
				Object.entries(extraDrafts).map(([feeId, draft]) =>
					draft.reset
						? deletePlatformFeesByFeeIdCompaniesByCompanyId(feeId, companyId)
						: putPlatformFeesByFeeIdCompaniesByCompanyId(feeId, companyId, {
								active: draft.active,
								fixedOverride: reaisToNullableCents(draft.fixed),
								percentageOverride: percentToBasisPoints(draft.percentage),
							}),
				),
			);
			await putPlatformFeesByCompanyByCompanyId(companyId, {
				disabledLanes: [...disabledLanes].sort(),
				mode,
				simintpay: {
					// BOLETO is read-only: returned by the API but not accepted in the update body.
					lanes: lanes.flatMap(lane =>
						lane.method === "BOLETO"
							? []
							: [
									{
										channel: lane.channel,
										fixedCents: drafts[laneId(lane)]!.fixed === ""
											? Number(globalDefaults.get(laneId(lane))?.fixedCents ?? lane.fixedCents)
											: reaisToCents(drafts[laneId(lane)]!.fixed),
										installments: Number(lane.installments),
										method: lane.method,
										ratePpm: drafts[laneId(lane)]!.rate === ""
											? Number(globalDefaults.get(laneId(lane))?.ratePpm ?? lane.ratePpm)
											: percentToPpm(drafts[laneId(lane)]!.rate),
									},
								],
					),
					version: fees.simintpay.version,
				},
			});
			await Promise.all([
				queryClient.invalidateQueries({ queryKey: getPlatformFeesByCompanyByCompanyIdQueryKey(companyId) }),
				queryClient.invalidateQueries({ queryKey: getPlatformFeesUnderCoveredCompaniesQueryKey() }),
				...Object.keys(extraDrafts).map(feeId => queryClient.invalidateQueries({ queryKey: getPlatformFeesByFeeIdCompaniesQueryKey(feeId) })),
			]);
			showToast(t("admin.companies.fees.saved"), "positive");
			history.back();
		} catch {
			void showAlert(t("admin.companies.fees.saveError"));
		} finally {
			setSaving(false);
		}
	}

	return (
		<div className="space-y-6">
			{underCovered && (
				<p className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-destructive text-sm" role="alert">
					{t("admin.companies.fees.underCovered")}
				</p>
			)}

			<section className="space-y-2">
				<h3 className="font-semibold text-sm">{t("admin.companies.fees.mode.title")}</h3>
				<CustomSelect
					ariaLabel={t("admin.companies.fees.mode.title")}
					onChange={value => setMode(value as FeeMode)}
					options={MODES.map(value => ({ label: t(`admin.companies.fees.mode.${value}`), value }))}
					value={mode}
				/>
				<p className="text-muted-foreground text-xs">{t(`admin.companies.fees.mode.${mode}Hint`)}</p>
			</section>

			<section className="space-y-2">
				<h3 className="font-semibold text-sm">{t("admin.companies.fees.extras.title")}</h3>
				{overridden && <OverriddenFeesList additiveOverride={fees.additiveOverride} />}
				<p className="text-muted-foreground text-xs">{t("admin.companies.fees.extras.hint")}</p>
				<ExtraFeesList companyId={companyId} drafts={extraDrafts} mode={mode} onDraftChange={(feeId, draft) => setExtraDrafts(current => ({ ...current, [feeId]: draft }))} />
			</section>

			<section className="space-y-2">
				<h3 className="font-semibold text-sm">{t("admin.companies.fees.simintpay.title")}</h3>
				<p className="text-muted-foreground text-xs">{t("admin.companies.fees.simintpay.hint")}</p>
				<table className="w-full text-left text-sm">
					<thead className="text-muted-foreground text-xs">
						<tr>
							<th className="px-3 py-1 font-medium">{t("admin.companies.fees.columns.accepted")}</th>
							<th className="px-3 py-1 font-medium">{t("admin.companies.fees.columns.lane")}</th>
							<th className="px-3 py-1 font-medium">{t("admin.companies.fees.columns.cost")}</th>
							<th className="px-3 py-1 font-medium">{t("admin.companies.fees.columns.rate")}</th>
							<th className="px-3 py-1 font-medium">{t("admin.companies.fees.columns.fixed")}</th>
							<th className="px-3 py-1 font-medium">{t("admin.companies.fees.columns.effective")}</th>
							<th className="px-3 py-1 font-medium">{t("admin.companies.fees.columns.coverage")}</th>
						</tr>
					</thead>
					<tbody>
						{orderedLanes.map(lane => (
							<SimintpayLaneRow
								coverage={coverage.get(laneId(lane))}
								accepted={!disabledLanes.has(laneId(lane))}
								applied={mode !== "ADDITIVE_ONLY"}
								surcharge={surcharge}
								draft={drafts[laneId(lane)]!}
								globalDefault={globalDefaults.get(laneId(lane))}
								key={laneId(lane)}
								lane={lane}
								onAcceptedChange={accepted =>
									setDisabledLanes(current => {
										const next = new Set(current);
										if (accepted) next.delete(laneId(lane));
										else next.add(laneId(lane));
										return next;
									})
								}
								onChange={draft => setDrafts(current => ({ ...current, [laneId(lane)]: draft }))}
							/>
						))}
					</tbody>
				</table>
			</section>

			<div className="flex justify-end gap-2">
				<Button onClick={() => history.back()} type="button" variant="outline">
					{t("actions.discard")}
				</Button>
				<Button disabled={saving} onClick={() => void save()} type="button">
					{t("actions.save")}
				</Button>
			</div>
		</div>
	);
}

export function CompanyFeesModal({ companyId, companyName, isOpen, onClose }: CompanyFeesModalProps) {
	const { t } = useTranslation();
	const { data, isError, isPending } = useGetPlatformFeesByCompanyByCompanyId(companyId, { query: { enabled: isOpen } });

	return (
		<Modal
			isOpen={isOpen}
			maxWidth="880px"
			onClose={onClose}
			title={t("admin.companies.fees.title", { name: companyName })}
			urlKey="company-fees"
			urlState={companyId}
		>
			{isPending ? (
				<div className="space-y-4">
					<Skeleton className="h-10 w-full" />
					<Skeleton className="h-64 w-full" />
					<Skeleton className="h-20 w-full" />
				</div>
			) : isError ? (
				<ErrorState title={t("admin.companies.fees.loadError")} />
			) : (
				<FeesEditor companyId={companyId} fees={data} key={data.simintpay.version + data.mode} />
			)}
		</Modal>
	);
}
