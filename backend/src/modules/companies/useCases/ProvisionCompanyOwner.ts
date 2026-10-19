import { StaffErrors } from "@/modules/staff/errors";
import type { StaffReturn } from "@/modules/staff/dtos";
import type { InviteStaff, RequestPasswordResetFn } from "@/modules/staff/useCases/InviteStaff";
import { WithdrawalErrors } from "@/modules/withdrawals/errors";
import { DomainError } from "@/shared/errors";
import { simpayIntegrationKey, type SimpayClient } from "@/shared/infra/simpay";
import type { PrismaInstance } from "@/shared/infra/sql";

export class ProvisionCompanyOwner {
	constructor(private readonly prisma: PrismaInstance, private readonly invite: InviteStaff, private readonly simpay: SimpayClient, private readonly requestPasswordReset: RequestPasswordResetFn) {}

	async execute(company: { id: string; name: string; slug: string; cnpj: string | null; siteUrl: string | null }, input: { email: string; password?: string }): Promise<StaffReturn> {
		const email = input.email.trim().toLowerCase();
		const firstOwner = await this.prisma.user.findFirst({ orderBy: [{ createdAt: "asc" }, { id: "asc" }], where: { companyId: company.id, role: "owner" } });
		const existing = await this.prisma.user.findUnique({ where: { email } });
		// A provider failure leaves the local owner intact. Repeating the same request resumes it.
		if (existing && existing.id !== firstOwner?.id) throw new DomainError(StaffErrors.EMAIL_TAKEN);
		const staff = existing
			? { createdAt: existing.createdAt, email: existing.email, id: existing.id, name: existing.name, role: existing.role, unitIds: [] }
			: await this.invite.execute({ companyId: company.id, email, name: company.name, role: "owner", unitIds: [] }, { password: input.password, siteUrl: company.siteUrl ?? undefined });
		if (existing && !input.password) await this.requestPasswordReset({ body: { email, redirectTo: `${(company.siteUrl || process.env.APP_URL)?.replace(/\/$/, "")}/reset-password` } });
		const currentFirstOwner = await this.prisma.user.findFirst({ orderBy: [{ createdAt: "asc" }, { id: "asc" }], where: { companyId: company.id, role: "owner" } });
		if (currentFirstOwner?.id === staff.id) {
			try {
				const merchant = await this.simpay.provisionOwner({ externalMerchantId: company.id, integrationKey: simpayIntegrationKey(company.slug) }, { cnpj: company.cnpj, email, legalName: company.name, password: input.password });
				await this.prisma.company.update({ data: { simpayMerchantId: merchant.id }, where: { id: company.id } });
			} catch (error) {
				throw new DomainError(WithdrawalErrors.WITHDRAWAL_PROVIDER_ERROR, error instanceof Error ? error.message : undefined);
			}
		}
		return staff;
	}
}
