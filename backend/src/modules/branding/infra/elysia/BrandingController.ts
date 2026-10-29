import Elysia, { t } from "elysia";
import { CompanyScopeGuard } from "@/modules/users/guards";
import { GlobalPlugin } from "@/shared/infra/elysia/global";
import { prisma } from "@/shared/infra/sql";
import { BrandingReturn, CompanyWhatsAppQrReturn, CompanyWhatsAppReturn, GetBrandingQuery, UpdateBrandingBody } from "../../dtos";
import { CompanyWhatsApp, GetBranding, UpdateBranding } from "../../useCases";

const getBranding = new GetBranding(prisma);
const updateBranding = new UpdateBranding(prisma);
const companyWhatsApp = new CompanyWhatsApp(prisma);

export const BrandingController = new Elysia({ prefix: "/branding" })
	.use(GlobalPlugin)
	.get("/", async ({ query }) => getBranding.execute(query), {
		query: GetBrandingQuery,
		response: BrandingReturn,
	})
	.get("/tracking-settings", async ({ request, set }) => {
        const scope = await CompanyScopeGuard.execute(request.headers);
        CompanyScopeGuard.authorize(scope, "branding", "read");
        set.headers["Cache-Control"] = "no-store";
        const company = await prisma.company.findUniqueOrThrow({ where: { id: scope.companyId! }, select: { metaCapiToken: true } });
        return { hasMetaCapiToken: Boolean(company.metaCapiToken) };
    }, { response: t.Object({ hasMetaCapiToken: t.Boolean() }) })
    .put(
		"/",
		async ({ body, request }) => {
			const scope = await CompanyScopeGuard.execute(request.headers);
			CompanyScopeGuard.authorize(scope, "branding", "update");
			return updateBranding.execute({ ...body, companyId: scope.companyId! });
		},
		{ body: UpdateBrandingBody, response: BrandingReturn },
	)
	.get("/whatsapp", async ({ request }) => {
		const scope = await CompanyScopeGuard.execute(request.headers);
		CompanyScopeGuard.authorize(scope, "branding", "read");
		return companyWhatsApp.get(scope.companyId!);
	}, { response: CompanyWhatsAppReturn })
	.post("/whatsapp/session", async ({ request }) => {
		const scope = await CompanyScopeGuard.execute(request.headers);
		CompanyScopeGuard.authorize(scope, "branding", "update");
		return companyWhatsApp.connect(scope.companyId!);
	}, { response: CompanyWhatsAppReturn })
	.get("/whatsapp/qr", async ({ request, set }) => {
		const scope = await CompanyScopeGuard.execute(request.headers);
		CompanyScopeGuard.authorize(scope, "branding", "read");
		set.headers["Cache-Control"] = "no-store";
		return { dataUrl: await companyWhatsApp.qr(scope.companyId!) };
	}, { response: CompanyWhatsAppQrReturn })
	.post("/whatsapp/disconnect", async ({ request }) => {
		const scope = await CompanyScopeGuard.execute(request.headers);
		CompanyScopeGuard.authorize(scope, "branding", "update");
		return companyWhatsApp.disconnect(scope.companyId!);
	}, { response: CompanyWhatsAppReturn });
