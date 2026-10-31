import Elysia from "elysia";
import { AuthGuard } from "@/modules/users/guards";
import { DomainError } from "@/shared/errors";
import { GlobalPlugin } from "@/shared/infra/elysia/global";
import type { PrismaInstance } from "@/shared/infra/sql";
import { UserErrors } from "@/modules/users/errors";
import { CompanyFeeDefaultsReturn, CompanyFeesReturn, UpdateCompanyFeesBody } from "../../dtos";
import { CompanyFees } from "../../useCases";

async function requireSuperAdmin(request: Request, prisma: PrismaInstance) {
	const auth = await AuthGuard.execute(request.headers);
	const user = await prisma.user.findUnique({ select: { role: true }, where: { id: auth.userId } });
	requireSuperAdminRole(user?.role);
}

export function requireSuperAdminRole(role: string | undefined) {
	if (role !== "superAdmin") throw new DomainError(UserErrors.FORBIDDEN);
}

export const PlatformFeesController = new Elysia({ detail: { tags: ["Platform Fees"] } })
	.use(GlobalPlugin)
	.group("/platform-fees", app =>
		app
			.decorate(({ prisma }) => ({ companyFees: new CompanyFees(), prisma }))
			.onBeforeHandle(async ({ request, prisma }) => requireSuperAdmin(request, prisma))
			.get("/by-company-defaults", ({ companyFees }) => companyFees.defaults(), {
				response: CompanyFeeDefaultsReturn,
			})
			.get("/by-company/:companyId", ({ companyFees, params }) => companyFees.get(params.companyId), {
				response: CompanyFeesReturn,
			})
			.put("/by-company/:companyId", ({ body, companyFees, params }) => companyFees.update(params.companyId, body), {
				body: UpdateCompanyFeesBody,
				response: CompanyFeesReturn,
			}),
	);
