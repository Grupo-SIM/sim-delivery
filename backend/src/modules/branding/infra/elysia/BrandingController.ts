import Elysia from "elysia";
import { CompanyScopeGuard } from "@/modules/users/guards";
import { prisma } from "@/shared/infra/sql";
import { BrandingReturn, GetBrandingQuery, UpdateBrandingBody } from "../../dtos";
import { GetBranding, UpdateBranding } from "../../useCases";

const getBranding = new GetBranding(prisma);
const updateBranding = new UpdateBranding(prisma);

export const BrandingController = new Elysia({ prefix: "/branding" })
	.get(
		"/",
		async ({ query, request }) => {
			// Public endpoint: resolve companyId from auth header if present, else from unitId
			let companyId: string | null = null;
			try {
				const scope = await CompanyScopeGuard.execute(request.headers);
				companyId = scope.companyId;
			} catch {
				// unauthenticated — resolve from unitId query param
			}
			return getBranding.execute(companyId, query);
		},
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
