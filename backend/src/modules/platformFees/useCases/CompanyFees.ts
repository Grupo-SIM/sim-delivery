import { DomainError } from "@/shared/errors";
import { simpay, type SimpayClient, type SimpayCompanyFees } from "@/shared/infra/simpay";
import type { PrismaInstance } from "@/shared/infra/sql";
import type { CompanyFeesReturn, UpdateCompanyFeesBody } from "../dtos";
import { PlatformFeeErrors } from "../errors";
import { listCompanySurcharges } from "../effectiveFees";
import { evaluateCoverage, hasShortfall, surchargeComponents, type PlatformFeeMode } from "../feeCoverage";

export class CompanyFees {
	constructor(
		private readonly prisma: PrismaInstance,
		private readonly provider: Pick<SimpayClient, "companyFees" | "saveCompanyFees"> = simpay,
	) {}

	async get(companyId: string): Promise<CompanyFeesReturn> {
		const mode = await this.mode(companyId);
		return this.build(companyId, mode, await this.provider.companyFees(companyId));
	}

	async update(companyId: string, input: UpdateCompanyFeesBody): Promise<CompanyFeesReturn> {
		const current = await this.mode(companyId);
		const mode = input.mode ?? current;
		let provider = { ...(await this.provider.companyFees(companyId)), mode };
		if (input.simintpay) provider = { ...provider, ...input.simintpay, lanes: this.merge(provider, input.simintpay.lanes) };
		const result = await this.build(companyId, mode, provider);
		if (result.underCovered) throw new DomainError(PlatformFeeErrors.FEES_BELOW_ACQUIRER_COST);
		if (input.simintpay || mode !== current) {
			// SimIntPay owns the mode and the SimIntPay fees; the local column only mirrors it for pricing.
			const version = input.simintpay?.version ?? provider.version;
			provider = await this.provider.saveCompanyFees(companyId, { lanes: input.simintpay?.lanes ?? [], mode, version });
		}
		if (mode !== current) await this.prisma.company.update({ data: { platformFeeMode: mode }, where: { id: companyId } });
		return this.build(companyId, mode, provider);
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

	private async mode(companyId: string): Promise<PlatformFeeMode> {
		const company = await this.prisma.company.findUnique({ select: { platformFeeMode: true }, where: { id: companyId } });
		if (!company) throw new DomainError(PlatformFeeErrors.COMPANY_NOT_FOUND_FOR_FEES);
		return company.platformFeeMode as PlatformFeeMode;
	}

	private async build(companyId: string, mode: PlatformFeeMode, provider: SimpayCompanyFees): Promise<CompanyFeesReturn> {
		const surcharges = await listCompanySurcharges(this.prisma, companyId);
		const coverage = evaluateCoverage({
			costs: provider.costs,
			mode,
			simintpay: provider.lanes,
			surcharges: surchargeComponents(surcharges),
		});
		return {
			coverage,
			extras: mode === "SIMINTPAY_ONLY" ? [] : surcharges,
			mode,
			simintpay: { lanes: provider.lanes, version: provider.version },
			underCovered: hasShortfall(coverage),
		};
	}
}
