import { DomainError } from "@/shared/errors";
import { simpay, type SimpayClient, type SimpayCompanyFees } from "@/shared/infra/simpay";
import type { PrismaInstance } from "@/shared/infra/sql";
import type { CompanyFeesReturn, UpdateCompanyFeesBody } from "../dtos";
import { PlatformFeeErrors } from "../errors";
import { invalidateCompanyFeeMode, rememberCompanyFeeMode } from "../companyFeeMode";
import { listCompanySurcharges } from "../effectiveFees";
import { evaluateCoverage, hasShortfall, surchargeComponents } from "../feeCoverage";

export class CompanyFees {
	constructor(
		private readonly prisma: PrismaInstance,
		private readonly provider: Pick<SimpayClient, "companyFees" | "saveCompanyFees"> = simpay,
	) {}

	async get(companyId: string): Promise<CompanyFeesReturn> {
		const provider = await this.provider.companyFees(companyId);
		rememberCompanyFeeMode(companyId, provider);
		return this.build(companyId, provider);
	}

	/** SimIntPay owns the mode and its fees; Delivery only forwards the edit after checking acquirer cost. */
	async update(companyId: string, input: UpdateCompanyFeesBody): Promise<CompanyFeesReturn> {
		const current = await this.provider.companyFees(companyId);
		const disabledLanes = input.disabledLanes ?? current.disabledLanes;
		let provider: SimpayCompanyFees = { ...current, disabledLanes, mode: input.mode ?? current.mode };
		if (input.simintpay) provider = { ...provider, ...input.simintpay, lanes: this.merge(provider, input.simintpay.lanes) };
		if ((await this.build(companyId, provider)).underCovered) throw new DomainError(PlatformFeeErrors.FEES_BELOW_ACQUIRER_COST);
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

	/** Throws when the company's current fees (as they stand) no longer cover acquirer cost. */
	async assertCovered(companyId: string): Promise<void> {
		if ((await this.get(companyId)).underCovered) throw new DomainError(PlatformFeeErrors.FEES_BELOW_ACQUIRER_COST);
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
