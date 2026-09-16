import Elysia, { t } from "elysia";
import { AuthGuard } from "@/modules/users/guards";
import { DomainError } from "@/shared/errors";
import { GlobalPlugin } from "@/shared/infra/elysia/global";
import type { PrismaInstance } from "@/shared/infra/sql";
import { UserErrors } from "@/modules/users/errors";
import {
	CompanyFeeOverrideListReturn,
	CreatePlatformFeeBody,
	PlatformFeeListReturn,
	PlatformFeeReturn,
	UpdatePlatformFeeBody,
	UpsertCompanyFeeOverrideBody,
} from "../../dtos";
import { PlatformFees } from "../../useCases";

async function requireSuperAdmin(request: Request, prisma: PrismaInstance) {
	const auth = await AuthGuard.execute(request.headers);
	const user = await prisma.user.findUnique({ select: { role: true }, where: { id: auth.userId } });
	if (user?.role !== "superAdmin") throw new DomainError(UserErrors.FORBIDDEN);
}

export const PlatformFeesController = new Elysia({ detail: { tags: ["Platform Fees"] } })
	.use(GlobalPlugin)
	.group("/platform-fees", app =>
		app
			.decorate(({ prisma }) => ({ platformFees: new PlatformFees(prisma), prisma }))
			.onBeforeHandle(async ({ request, prisma }) => requireSuperAdmin(request, prisma))
			.get("/", ({ platformFees }) => platformFees.list(), { response: PlatformFeeListReturn })
			.post("/", ({ body, platformFees }) => platformFees.create(body), {
				body: CreatePlatformFeeBody,
				response: PlatformFeeReturn,
			})
			.patch("/:feeId", ({ body, params, platformFees }) => platformFees.update(params.feeId, body), {
				body: UpdatePlatformFeeBody,
				response: PlatformFeeReturn,
			})
			.delete("/:feeId", async ({ params, platformFees }) => {
				await platformFees.remove(params.feeId);
				return { ok: true };
			}, { response: t.Object({ ok: t.Boolean() }) })
			.get("/:feeId/companies", ({ params, platformFees }) => platformFees.listCompanies(params.feeId), {
				response: CompanyFeeOverrideListReturn,
			})
			.put("/:feeId/companies/:companyId", async ({ body, params, platformFees }) => {
				await platformFees.upsertCompany(params.feeId, params.companyId, body);
				return { ok: true };
			}, { body: UpsertCompanyFeeOverrideBody, response: t.Object({ ok: t.Boolean() }) })
			.delete("/:feeId/companies/:companyId", async ({ params, platformFees }) => {
				await platformFees.resetCompany(params.feeId, params.companyId);
				return { ok: true };
			}, { response: t.Object({ ok: t.Boolean() }) }),
	);
