import { simpay, type SimpayClient, type SimpayCompanyFees } from "@/shared/infra/simpay";
import type { CompanyFeeDefaultsReturn, CompanyFeesReturn, UpdateCompanyFeesBody } from "../dtos";
import { invalidateCompanyFeeMode, rememberCompanyFeeMode } from "../companyFeeMode";

export class CompanyFees {
	constructor(
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
		return this.build(provider);
	}

	/** SimIntPay owns mode, lanes and additive fees; Delivery forwards the edit, which SimIntPay validates against acquirer cost atomically. */
	async update(companyId: string, input: UpdateCompanyFeesBody): Promise<CompanyFeesReturn> {
		const current = await this.provider.companyFees(companyId);
		const disabledLanes = input.disabledLanes ?? current.disabledLanes;
		const mode = input.mode ?? current.mode;
		const changed = !!input.simintpay || !!input.disabledLanes || !!input.additiveFees?.length || mode !== current.mode;
		if (!changed) return this.build(current);
		invalidateCompanyFeeMode(companyId);
		const saved = await this.provider.saveCompanyFees(companyId, {
			...(input.additiveFees?.length ? { additiveFees: input.additiveFees } : {}),
			disabledLanes,
			lanes: input.simintpay?.lanes ?? [],
			mode,
			version: input.simintpay?.version ?? current.version,
		});
		rememberCompanyFeeMode(companyId, saved);
		return this.build(saved);
	}

	private build(provider: SimpayCompanyFees): CompanyFeesReturn {
		return {
			additiveFees: provider.additiveFees ?? [],
			coverage: provider.coverage ?? [],
			disabledLanes: provider.disabledLanes ?? [],
			mode: provider.mode,
			simintpay: { lanes: provider.lanes, version: provider.version },
			underCovered: provider.underCovered ?? false,
		};
	}
}
