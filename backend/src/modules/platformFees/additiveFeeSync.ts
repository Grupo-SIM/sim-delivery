import { PaymentProviderError } from "@/shared/infra/paymentProviderError";
import { simpay, type SimpayAdditiveTotals, type SimpayClient, type SimpayCompanyFees } from "@/shared/infra/simpay";
import type { PrismaInstance } from "@/shared/infra/sql";
import { emptyTotals, sameTotals, sumAdditiveTotals } from "./additiveTotals";
import { invalidateCompanyFeeMode, rememberCompanyFeeMode } from "./companyFeeMode";
import { listCompanySurcharges } from "./effectiveFees";
import { undoAssociationsWhileOverridden } from "./overrideAssociations";

export type AdditiveFeeProvider = Pick<SimpayClient, "companyFees" | "saveCompanyFees">;

/** Delivery's total: the sum per scope of the company's active resolved fees (company overrides applied). */
export async function resolveAdditiveTotals(prisma: PrismaInstance, companyId: string): Promise<SimpayAdditiveTotals> {
	return sumAdditiveTotals(await listCompanySurcharges(prisma, companyId));
}

export type PushResult = "pushed" | "skipped-overridden" | "skipped-unchanged" | "skipped-unregistered";

/** Resolves a company's additive totals and stores them in SimIntPay as Delivery's total; Delivery owns the catalog. */
export class AdditiveFeeSync {
	constructor(
		private readonly prisma: PrismaInstance,
		private readonly provider: AdditiveFeeProvider = simpay,
	) {}

	resolve(companyId: string) {
		return resolveAdditiveTotals(this.prisma, companyId);
	}

	/**
	 * Pushes only when SimIntPay's Delivery total differs. Companies SimIntPay does not know are skipped. While a
	 * SimIntPay admin override is active nothing is pushed: associations are undone instead and SimIntPay's total rules.
	 */
	async push(companyId: string, options: { dryRun?: boolean } = {}): Promise<{ result: PushResult; totals: SimpayAdditiveTotals }> {
		let current: SimpayCompanyFees;
		try {
			current = await this.provider.companyFees(companyId);
		} catch (error) {
			if (error instanceof PaymentProviderError && error.status === 404) return { result: "skipped-unregistered", totals: emptyTotals() };
			throw error;
		}
		if (current.additiveFees?.override) {
			if (!options.dryRun) await undoAssociationsWhileOverridden(this.prisma, companyId, current.additiveFees);
			return { result: "skipped-overridden", totals: current.additiveFees.effective };
		}
		const totals = await this.resolve(companyId);
		if (sameTotals(current.additiveFees?.delivery, totals)) return { result: "skipped-unchanged", totals };
		if (!options.dryRun) {
			// Empty lanes leave SimIntPay's lane fees untouched; mode and disabled lanes are echoed back.
			const saved = await this.provider.saveCompanyFees(companyId, {
				additiveFees: totals,
				disabledLanes: current.disabledLanes,
				lanes: [],
				mode: current.mode,
				version: current.version,
			});
			invalidateCompanyFeeMode(companyId);
			if (saved?.mode) rememberCompanyFeeMode(companyId, saved);
		}
		return { result: "pushed", totals };
	}

/** Resyncs the given companies (all when omitted) with limited concurrency; returns per-company failures. */
	async pushMany(companyIds?: string[], options: { concurrency?: number; dryRun?: boolean } = {}) {
		const ids = companyIds ?? (await this.prisma.company.findMany({ select: { id: true } })).map(company => company.id);
		const outcomes: Array<{ companyId: string; error?: unknown; result?: PushResult; totals?: SimpayAdditiveTotals }> = [];
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
