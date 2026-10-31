import { simpay, type SimpayClient, type SimpayCompanyFees } from "@/shared/infra/simpay";
import type { PrismaInstance } from "@/shared/infra/sql";
import type { CompanyFeeDefaultsReturn, CompanyFeesReturn, UpdateCompanyFeesBody } from "../dtos";
import { invalidateCompanyFeeMode, rememberCompanyFeeMode } from "../companyFeeMode";
import { listCompanySurcharges } from "../effectiveFees";
import { evaluateCoverage, hasShortfall, surchargeComponents } from "../feeCoverage";

export class CompanyFees {
	constructor(
		private readonly prisma: PrismaInstance,
		private readonly provider: Pick<SimpayClient, "companyFees" | "saveCompanyFees"> = simpay,
		private readonly defaultsProvider: Pick<SimpayClient, "feeDefaults"> = simpay,
	) {}

	/** Global SimIntPay fees and acquirer cost, so the admin sees what an empty override falls back to. */
	defaults(): Promise<CompanyFeeDefaultsReturn> {
		return this.defaultsProvider.feeDefaults();
	}

	async get(companyId: string): Promise<CompanyFeesReturn> {
		const provider = await this.provider.companyFees(companyId);
		rememberCompanyFeeMode(companyId, provider);
		return this.build(companyId, provider);
	}

	/** SimIntPay owns the mode and its fees; Delivery only forwards the edit; SimIntPay validates it against acquirer cost. */
	async update(companyId: string, input: UpdateCompanyFeesBody): Promise<CompanyFeesReturn> {
		const current = await this.provider.companyFees(companyId);
		const disabledLanes = input.disabledLanes ?? current.disabledLanes;
		let provider: SimpayCompanyFees = { ...current, disabledLanes, mode: input.mode ?? current.mode };
		if (input.simintpay) provider = { ...provider, ...input.simintpay, lanes: this.merge(provider, input.simintpay.lanes) };
		if (input.simintpay || input.disabledLanes || provider.mode !== current.mode) {
			invalidateCompanyFeeMode(companyId);
			provider = await this.provider.saveCompanyFees(companyId, {
				disabledLanes,
				lanes: input.simintpay?.lanes ?? [],
				mode: provider.mode,
				version: input.simintpay?.version ?? current.version,
			});
			rememberCompanyFeeMode(companyId, provider);
		}
		return this.build(companyId, provider);
	}

	private merge(provider: SimpayCompanyFees, edits: SimpayCompanyFees["lanes"]) {
		const lanes = provider.lanes.filter(
			lane => !edits.some(edit => edit.method === lane.method && edit.installments === lane.installments),
		);
		return [...lanes, ...edits];
	}

	private async build(companyId: string, provider: SimpayCompanyFees): Promise<CompanyFeesReturn> {
		const mode = provider.mode;
		const surcharges = await listCompanySurcharges(this.prisma, companyId);
		const coverage = evaluateCoverage({
			costs: provider.costs,
			disabledLanes: provider.disabledLanes,
			mode,
			simintpay: provider.lanes,
			surcharges: surchargeComponents(surcharges),
		});
		return {
			coverage,
			disabledLanes: provider.disabledLanes ?? [],
			extras: mode === "SIMINTPAY_ONLY" ? [] : surcharges,
			mode,
			simintpay: { lanes: provider.lanes, version: provider.version },
			underCovered: hasShortfall(coverage),
		};
	}
}
