import Elysia, { t } from "elysia";
import { CompanyScopeGuard } from "@/modules/users/guards";
import { GlobalPlugin } from "@/shared/infra/elysia/global";
import { CompanyListReturn, CompanyReturn, CreateCompanyBody, UpdateCompanyBody } from "../../dtos";
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
