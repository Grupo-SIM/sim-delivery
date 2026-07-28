import Elysia from "elysia";
import { CompanyScopeGuard } from "@/modules/users/guards";
import { GlobalPlugin } from "@/shared/infra/elysia/global";
import { prisma } from "@/shared/infra/sql";
import { BrandingReturn, GetBrandingQuery, UpdateBrandingBody } from "../../dtos";
import { GetBranding, UpdateBranding } from "../../useCases";

const getBranding = new GetBranding(prisma);
const updateBranding = new UpdateBranding(prisma);

export const BrandingController = new Elysia({ prefix: "/branding" })
	.use(GlobalPlugin)
	.get(
		"/",
		async ({ query }) => getBranding.execute(query),
		{ query: GetBrandingQuery, response: BrandingReturn },
	)
	.put(
		"/",
		async ({ body, request }) => {
			const scope = await CompanyScopeGuard.execute(request.headers);
			CompanyScopeGuard.authorize(scope, "branding", "update");
			return updateBranding.execute({ ...body, companyId: scope.companyId! });
		},
		{ body: UpdateBrandingBody, response: BrandingReturn },
	);
