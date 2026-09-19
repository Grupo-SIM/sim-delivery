import { DomainError } from "@/shared/errors";
import { simpayIntegrationKey, type SimpayClient, type SimpayMerchantScope, type SimpayWithdrawal } from "@/shared/infra/simpay";
import type { PrismaInstance } from "@/shared/infra/sql";
import type { LocalWithdrawalStatus } from "./dtos";
import { WithdrawalErrors } from "./errors";

const providerStatuses = new Set(["PENDING", "APPROVED", "COMPLETED", "REJECTED"]);
const localStatuses = new Set<LocalWithdrawalStatus>(["submitting", "PENDING", "APPROVED", "COMPLETED", "REJECTED"]);
const terminalStatuses = new Set(["COMPLETED", "REJECTED"]);

export class WithdrawalService {
	constructor(
		private readonly prisma: PrismaInstance,
		private readonly simpay: SimpayClient,
	) {}

	private async company(companyId: string) {
		const company = await this.prisma.company.findUnique({ where: { id: companyId } });
		if (!company?.cnpj) throw new DomainError(WithdrawalErrors.WITHDRAWAL_MERCHANT_NOT_CONFIGURED);
		return company;
	}

	private merchant(company: { id: string; slug: string }): SimpayMerchantScope {
		return { externalMerchantId: company.id, integrationKey: simpayIntegrationKey(company.slug) };
	}

	async summary(companyId: string) {
		const company = await this.prisma.company.findUnique({ where: { id: companyId } });
		if (!company?.cnpj) {
			return {
				availableBalanceCents: 0,
				blockReason: "MERCHANT_NOT_CONFIGURED",
				canRequest: false,
				configured: false,
				feePolicy: { fixedCents: 0, percentBasisPoints: 0 },
				minimumCents: company?.withdrawalMinimumCents ?? null,
				pixKey: company?.withdrawalPixKey ?? null,
				processingCount: 0,
				processingGrossCents: 0,
			};
		}
		try {
			const summary = await this.simpay.getWithdrawalSummary(this.merchant(company));
			return { ...summary, configured: true, minimumCents: company.withdrawalMinimumCents, pixKey: company.withdrawalPixKey };
		} catch (error) {
			throw new DomainError(WithdrawalErrors.WITHDRAWAL_PROVIDER_ERROR, error instanceof Error ? error.message : undefined);
		}
	}

	async quote(companyId: string, grossAmountCents: number) {
		const company = await this.company(companyId);
		this.validateAmount(company.withdrawalMinimumCents, grossAmountCents);
		try {
			return await this.simpay.quoteWithdrawal(this.merchant(company), grossAmountCents);
		} catch (error) {
			throw new DomainError(WithdrawalErrors.WITHDRAWAL_PROVIDER_ERROR, error instanceof Error ? error.message : undefined);
		}
	}

	async request(companyId: string, userId: string, grossAmountCents: number, pixKeyInput: string) {
		const company = await this.company(companyId);
		this.validateAmount(company.withdrawalMinimumCents, grossAmountCents);
		const pixKey = pixKeyInput.trim();
		if (!pixKey) throw new DomainError(WithdrawalErrors.WITHDRAWAL_INVALID_AMOUNT);
		const local = await this.prisma.withdrawal.create({
			data: { companyId, grossAmountCents, pixKey, requestedById: userId },
		});
		try {
			const provider = await this.simpay.requestWithdrawal(this.merchant(company), { grossAmountCents, pixKey, requestId: local.id });
			const updated = await this.applyProvider(local.id, provider);
			await this.prisma.company.update({ where: { id: companyId }, data: { withdrawalPixKey: pixKey } });
			return this.serialize(updated);
		} catch (error) {
			// Keep the request recoverable: the provider may have persisted it before a
			// network failure. Its local id remains the provider idempotency key and the
			// next history poll reconciles the authoritative status.
			await this.prisma.withdrawal.update({ where: { id: local.id }, data: { rejectionReason: error instanceof Error ? error.message : String(error) } });
			throw new DomainError(WithdrawalErrors.WITHDRAWAL_PROVIDER_ERROR, error instanceof Error ? error.message : undefined);
		}
	}

	async list(companyId: string, page: number, pageSize: number) {
		const company = await this.company(companyId);
		try {
			const provider = await this.simpay.listWithdrawals(this.merchant(company), page, pageSize);
			for (const item of provider.items) await this.upsertProvider(companyId, item);
		} catch {
			// Local mirror stays readable during a transient provider outage.
		}
		const where = { companyId };
		const [totalItems, items] = await Promise.all([
			this.prisma.withdrawal.count({ where }),
			this.prisma.withdrawal.findMany({ where, orderBy: { createdAt: "desc" }, skip: (page - 1) * pageSize, take: pageSize }),
		]);
		return { items: items.map(item => this.serialize(item)), meta: { page, pageSize, totalItems, totalPages: Math.max(1, Math.ceil(totalItems / pageSize)) } };
	}

	async get(companyId: string, id: string) {
		const company = await this.company(companyId);
		const item = await this.prisma.withdrawal.findFirst({ where: { companyId, id } });
		if (!item) throw new DomainError(WithdrawalErrors.WITHDRAWAL_NOT_FOUND);
		if (item.externalWithdrawalId) {
			try {
				const provider = await this.simpay.getWithdrawal(this.merchant(company), item.externalWithdrawalId);
				return this.serialize(await this.applyProvider(item.id, provider));
			} catch { /* return mirror */ }
		}
		return this.serialize(item);
	}

	async webhook(input: { eventId: string; externalMerchantId: string; rejectionReason: string | null; requestId: string | null; status: string; updatedAt: string; withdrawalId: string }) {
		if (!providerStatuses.has(input.status)) return { ok: true };
		const local = input.requestId
			? await this.prisma.withdrawal.findFirst({ where: { companyId: input.externalMerchantId, id: input.requestId } })
			: await this.prisma.withdrawal.findFirst({ where: { companyId: input.externalMerchantId, externalWithdrawalId: input.withdrawalId } });
		if (!local) return { ok: true };
		await this.prisma.$transaction(async tx => {
			const providerUpdatedAt = new Date(input.updatedAt);
			if (Number.isNaN(providerUpdatedAt.getTime())) return;
			if (local.providerUpdatedAt && providerUpdatedAt < local.providerUpdatedAt) return;
			if (terminalStatuses.has(local.status) && local.status !== input.status) return;
			await tx.withdrawalStatusEvent.upsert({
				create: { fromStatus: local.status, payload: input, providerEventId: input.eventId, toStatus: input.status, withdrawalId: local.id },
				update: {},
				where: { providerEventId: input.eventId },
			});
			await tx.withdrawal.update({
				where: { id: local.id },
				data: { externalWithdrawalId: input.withdrawalId, providerUpdatedAt, rejectionReason: input.rejectionReason, status: input.status },
			});
		});
		return { ok: true };
	}

	private validateAmount(minimumCents: number | null, grossAmountCents: number) {
		if (!Number.isInteger(grossAmountCents) || grossAmountCents <= 0) throw new DomainError(WithdrawalErrors.WITHDRAWAL_INVALID_AMOUNT);
		if (minimumCents !== null && grossAmountCents < minimumCents) throw new DomainError(WithdrawalErrors.WITHDRAWAL_AMOUNT_BELOW_MINIMUM);
	}

	private async applyProvider(localId: string, provider: SimpayWithdrawal) {
		return this.prisma.withdrawal.update({
			where: { id: localId },
			data: {
				externalWithdrawalId: provider.id,
				feeCents: provider.feeCents,
				netAmountCents: provider.netAmountCents,
				providerCreatedAt: new Date(provider.createdAt),
				providerUpdatedAt: new Date(provider.updatedAt),
				rejectionReason: provider.rejectionReason,
				status: provider.status,
			},
		});
	}

	private async upsertProvider(companyId: string, provider: SimpayWithdrawal) {
		const local = provider.requestId ? await this.prisma.withdrawal.findUnique({ where: { id: provider.requestId } }) : null;
		if (local?.companyId === companyId) return this.applyProvider(local.id, provider);
		return null;
	}

	private serialize(item: {
		createdAt: Date;
		externalWithdrawalId: string | null;
		feeCents: number;
		grossAmountCents: number;
		id: string;
		netAmountCents: number;
		pixKey: string;
		rejectionReason: string | null;
		status: string;
		updatedAt: Date;
	}) {
		const status = localStatuses.has(item.status as LocalWithdrawalStatus)
			? item.status as LocalWithdrawalStatus
			: "submitting";
		return {
			createdAt: item.createdAt,
			externalWithdrawalId: item.externalWithdrawalId,
			feeCents: item.feeCents,
			grossAmountCents: item.grossAmountCents,
			id: item.id,
			netAmountCents: item.netAmountCents,
			pixKey: item.pixKey,
			rejectionReason: item.rejectionReason,
			status,
			updatedAt: item.updatedAt,
		};
	}
}
