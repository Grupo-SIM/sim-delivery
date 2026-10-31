import { useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { CustomSelect } from "@/components/ui/CustomSelect";
import { ErrorState } from "@/components/ui/ErrorState";
import { Modal } from "@/components/ui/Modal";
import { Skeleton } from "@/components/ui/Skeleton";
import {
	getPlatformFeesByCompanyByCompanyIdQueryKey,
	putPlatformFeesByCompanyByCompanyId,
	useGetPlatformFeesByCompanyByCompanyId,
} from "@/lib/api";
import { showAlert, showToast } from "@/stores";
import { ExtraFeesList } from "./ExtraFeesList";
import { SimintpayLaneRow, initialDraft } from "./SimintpayLaneRow";
import { type CompanyFees, type FeeMode, type LaneDraft, compareLanes, laneId, percentToPpm, reaisToCents } from "./types";

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
	const [saving, setSaving] = useState(false);
	const lanes = useMemo(() => [...fees.simintpay.lanes].sort(compareLanes), [fees.simintpay.lanes]);
	const coverage = useMemo(() => new Map(fees.coverage.map(lane => [laneId(lane), lane])), [fees.coverage]);

	async function save() {
		setSaving(true);
		try {
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
										fixedCents: reaisToCents(drafts[laneId(lane)]!.fixed),
										installments: Number(lane.installments),
										method: lane.method,
										ratePpm: percentToPpm(drafts[laneId(lane)]!.rate),
									},
								],
					),
					version: fees.simintpay.version,
				},
			});
			await queryClient.invalidateQueries({ queryKey: getPlatformFeesByCompanyByCompanyIdQueryKey(companyId) });
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
			{fees.underCovered && (
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
				<p className="text-muted-foreground text-xs">{t("admin.companies.fees.extras.hint")}</p>
				<ExtraFeesList extras={fees.extras} mode={mode} />
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
							<th className="px-3 py-1 font-medium">{t("admin.companies.fees.columns.coverage")}</th>
						</tr>
					</thead>
					<tbody>
						{lanes.map(lane => (
							<SimintpayLaneRow
								coverage={coverage.get(laneId(lane))}
								accepted={!disabledLanes.has(laneId(lane))}
								draft={drafts[laneId(lane)]!}
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
