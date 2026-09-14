import Elysia from "elysia";
import { CompanyScopeGuard } from "@/modules/users/guards";
import { GlobalPlugin } from "@/shared/infra/elysia/global";
import { ReceiptTemplate, UpdateReceiptTemplateBody } from "../../dtos";
import { GetReceiptTemplate, UpdateReceiptTemplate } from "../../useCases";

export const ReceiptTemplatesController = new Elysia({ detail: { tags: ["Receipt templates"] }, prefix: "/receipt-template" })
	.use(GlobalPlugin)
	.decorate(({ prisma, ...injected }) => ({
		...injected,
		getReceiptTemplate: new GetReceiptTemplate(prisma),
		updateReceiptTemplate: new UpdateReceiptTemplate(prisma),
	}))
	.get(
		"/",
		async ({ getReceiptTemplate, request }) => {
			const scope = await CompanyScopeGuard.execute(request.headers);
			CompanyScopeGuard.authorize(scope, "receiptTemplate", "read");
			return getReceiptTemplate.execute(scope.companyId!);
		},
		{ response: ReceiptTemplate },
	)
	.put(
		"/",
		async ({ body, request, updateReceiptTemplate }) => {
			const scope = await CompanyScopeGuard.execute(request.headers);
			CompanyScopeGuard.authorize(scope, "receiptTemplate", "update");
			return updateReceiptTemplate.execute({ ...body, companyId: scope.companyId! });
		},
		{ body: UpdateReceiptTemplateBody, response: ReceiptTemplate },
	);
