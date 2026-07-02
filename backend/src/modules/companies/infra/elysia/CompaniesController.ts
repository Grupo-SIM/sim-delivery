import Elysia from "elysia";
import { CompanyScopeGuard } from "@/modules/users/guards";
import { GlobalPlugin } from "@/shared/infra/elysia/global";
import { CompanyListReturn, CompanyReturn, CreateCompanyBody } from "../../dtos";
import { CreateCompany, ListCompanies } from "../../useCases";

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
				listCompanies: new ListCompanies(prisma),
				prisma,
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
			),
	);
