import Elysia, { t } from "elysia";
import { CompanyScopeGuard } from "@/modules/users/guards";
import { WithdrawalErrors } from "@/modules/withdrawals/errors";
import { isValidDocument } from "@/shared/cpf";
import { DomainError } from "@/shared/errors";
import { GlobalPlugin } from "@/shared/infra/elysia/global";
import { CompanyListReturn, CompanyReturn, CreateCompanyBody, UpdateCompanyBody, UpdateWithdrawalSettingsBody, WithdrawalSettingsReturn } from "../../dtos";
import { simpay, simpayIntegrationKey } from "@/shared/infra/simpay";
import { CompanyErrors } from "../../errors";
import { CreateCompany, DeleteCompany, ListCompanies, UpdateCompany } from "../../useCases";

export const CompaniesController = new Elysia({
	detail: {
		tags: ["Companies"],
	},
})
	.use([GlobalPlugin])
	.group("/companies", app =>
		app
			.decorate(({ prisma, ...injected }) => ({
				...injected,
				createCompany: new CreateCompany(prisma),
				deleteCompany: new DeleteCompany(prisma),
				listCompanies: new ListCompanies(prisma),
				prisma,
				updateCompany: new UpdateCompany(prisma),
			}))
			.post(
				"/",
				async ({ body, createCompany, request }) => {
					const scope = await CompanyScopeGuard.execute(request.headers);
					CompanyScopeGuard.authorize(scope, "company", "create");

					return createCompany.execute(body);
				},
				{
					body: CreateCompanyBody,
					response: CompanyReturn,
				},
			)
			.get(
				"/",
				async ({ listCompanies, request }) => {
					const scope = await CompanyScopeGuard.execute(request.headers);
					CompanyScopeGuard.authorize(scope, "company", "read");

					return listCompanies.execute();
				},
				{
					response: CompanyListReturn,
				},
			)
			.patch(
				"/:companyId/withdrawal-settings",
				async ({ body, params, prisma, request }) => {
					const scope = await CompanyScopeGuard.execute(request.headers);
					CompanyScopeGuard.authorize(scope, "withdrawals", "configure");
					const company = await prisma.company.findUnique({ where: { id: params.companyId } });
					if (!company) throw new DomainError(CompanyErrors.COMPANY_NOT_FOUND);
					if (!isValidDocument(body.cnpj)) throw new DomainError(WithdrawalErrors.WITHDRAWAL_INVALID_CNPJ);
					const companyWithCnpj = await prisma.company.findUnique({ where: { cnpj: body.cnpj } });
					if (companyWithCnpj && companyWithCnpj.id !== company.id) throw new DomainError(WithdrawalErrors.WITHDRAWAL_CNPJ_TAKEN);
					let merchant: { id: string };
					try {
						merchant = await simpay.provisionMerchant({ cnpj: body.cnpj, externalMerchantId: company.id, integrationKey: simpayIntegrationKey(company.slug), legalName: company.name });
					} catch (error) {
						throw new DomainError(WithdrawalErrors.WITHDRAWAL_PROVIDER_ERROR, error instanceof Error ? error.message : undefined);
					}
					const updated = await prisma.company.update({
						where: { id: company.id },
						data: { cnpj: body.cnpj, simpayMerchantId: merchant.id, withdrawalMinimumCents: body.minimumCents, ...(body.pixKey !== undefined && { withdrawalPixKey: body.pixKey.trim() || null }) },
					});
					return { cnpj: updated.cnpj!, minimumCents: updated.withdrawalMinimumCents, pixKey: updated.withdrawalPixKey, simpayMerchantId: updated.simpayMerchantId! };
				},
				{ body: UpdateWithdrawalSettingsBody, response: WithdrawalSettingsReturn },
			)
			.patch(
				"/:companyId",
				async ({ body, params, request, updateCompany }) => {
					const scope = await CompanyScopeGuard.execute(request.headers);
					CompanyScopeGuard.authorize(scope, "company", "update");

					return updateCompany.execute({ ...body, companyId: params.companyId });
				},
				{
					body: UpdateCompanyBody,
					response: CompanyReturn,
				},
			)
			.delete(
				"/:companyId",
				async ({ deleteCompany, params, request }) => {
					const scope = await CompanyScopeGuard.execute(request.headers);
					CompanyScopeGuard.authorize(scope, "company", "delete");

					await deleteCompany.execute(params.companyId);

					return { ok: true };
				},
				{ response: t.Object({ ok: t.Boolean() }) },
			),
	);
