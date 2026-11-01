import { PaymentProviderError } from "@/shared/infra/paymentProviderError";
import { simpay, type SimpayAdditiveValue, type SimpayClient, type SimpayCompanyFees } from "@/shared/infra/simpay";
import type { PrismaInstance } from "@/shared/infra/sql";
import type { EffectiveFeeReturn } from "./dtos";
import { listCompanySurcharges } from "./effectiveFees";

export type AdditiveFeeProvider = Pick<SimpayClient, "companyFees" | "saveCompanyFees">;

/** Flat value list SimIntPay stores: only active fees with company overrides already applied. */
export function toAdditiveValues(fees: EffectiveFeeReturn[]): SimpayAdditiveValue[] {
	return fees
		.map(fee => ({
			applicationScope: fee.applicationScope as SimpayAdditiveValue["applicationScope"],
			externalId: fee.id,
			fixedValue: fee.fixedValue,
			name: fee.name,
			percentageValue: fee.percentageValue,
		}))
		.sort((a, b) => a.externalId.localeCompare(b.externalId));
}

export function resolveAdditiveValues(prisma: PrismaInstance, companyId: string) {
	return listCompanySurcharges(prisma, companyId).then(toAdditiveValues);
}

export function sameAdditiveValues(a: SimpayAdditiveValue[] | undefined, b: SimpayAdditiveValue[]) {
	const normalize = (values: SimpayAdditiveValue[]) =>
		JSON.stringify(
			[...values]
				.sort((x, y) => x.externalId.localeCompare(y.externalId))
				.map(v => [v.externalId, v.name, v.applicationScope, v.percentageValue, v.fixedValue]),
		);
	return normalize(a ?? []) === normalize(b);
}

export type PushResult = "pushed" | "skipped-unchanged" | "skipped-unregistered";

/** Resolves a company's additive fees and replaces SimIntPay's stored list; Delivery owns the catalog. */
export class AdditiveFeeSync {
	constructor(
		private readonly prisma: PrismaInstance,
		private readonly provider: AdditiveFeeProvider = simpay,
	) {}

	resolve(companyId: string) {
		return resolveAdditiveValues(this.prisma, companyId);
	}

	/** Pushes only when SimIntPay's list differs. Companies SimIntPay does not know are skipped. */
	async push(companyId: string, options: { dryRun?: boolean } = {}): Promise<{ result: PushResult; values: SimpayAdditiveValue[] }> {
		let current: SimpayCompanyFees;
		try {
			current = await this.provider.companyFees(companyId);
		} catch (error) {
			if (error instanceof PaymentProviderError && error.status === 404) return { result: "skipped-unregistered", values: [] };
			throw error;
		}
		const values = await this.resolve(companyId);
		if (sameAdditiveValues(current.additiveFees, values)) return { result: "skipped-unchanged", values };
		if (!options.dryRun) {
			// Empty lanes leave SimIntPay's lane fees untouched; mode and disabled lanes are echoed back.
			await this.provider.saveCompanyFees(companyId, {
				additiveFees: values,
				disabledLanes: current.disabledLanes,
				lanes: [],
				mode: current.mode,
				version: current.version,
			});
		}
		return { result: "pushed", values };
	}

	/** Resyncs the given companies (all when omitted) with limited concurrency; returns per-company failures. */
	async pushMany(companyIds?: string[], options: { concurrency?: number; dryRun?: boolean } = {}) {
		const ids = companyIds ?? (await this.prisma.company.findMany({ select: { id: true } })).map(company => company.id);
		const outcomes: Array<{ companyId: string; error?: unknown; result?: PushResult; values?: SimpayAdditiveValue[] }> = [];
		const queue = [...ids];
		const worker = async () => {
			for (let id = queue.shift(); id !== undefined; id = queue.shift()) {
				try {
					outcomes.push({ companyId: id, ...(await this.push(id, options)) });
				} catch (error) {
					outcomes.push({ companyId: id, error });
				}
			}
		};
		await Promise.all(Array.from({ length: Math.max(1, Math.min(options.concurrency ?? 4, ids.length)) }, worker));
		return outcomes;
	}

	/** Companies a catalog fee currently applies to: everyone except those that disabled it by override. */
	async companiesAffectedBy(feeId: string, options: { all?: boolean } = {}): Promise<string[]> {
		const [companies, disabled] = await Promise.all([
			this.prisma.company.findMany({ select: { id: true } }),
			options.all
				? Promise.resolve([] as Array<{ companyId: string }>)
				: this.prisma.companyFeeOverride.findMany({ select: { companyId: true }, where: { active: false, feeId } }),
		]);
		const skip = new Set(disabled.map(item => item.companyId));
		return companies.map(company => company.id).filter(id => !skip.has(id));
	}

	/** Catalog changes touch many companies: failures are logged, never fail the admin edit; the sync script repairs drift. */
	async resyncAffected(feeId: string, options: { all?: boolean } = {}) {
		const outcomes = await this.pushMany(await this.companiesAffectedBy(feeId, options));
		for (const outcome of outcomes) {
			if (outcome.error) console.error(`[additive-fee-sync] company ${outcome.companyId} not synced`, outcome.error);
		}
		return outcomes;
	}
}
