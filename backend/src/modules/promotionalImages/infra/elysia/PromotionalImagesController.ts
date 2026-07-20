import Elysia, { t } from "elysia";
import { CompanyScopeGuard } from "@/modules/users/guards";
import { GlobalPlugin } from "@/shared/infra/elysia/global";
import {
	CreatePromotionalImageBody,
	PromotionalImageListReturn,
	PromotionalImageReturn,
	PromotionalImageUnitsReturn,
	SetPromotionalImageUnitsBody,
	SetUnitPromotionalImagesBody,
	UpdatePromotionalImageBody,
} from "../../dtos";
import {
	CreatePromotionalImage,
	DeletePromotionalImage,
	ListPromotionalImages,
	ListPromotionalImageUnits,
	ListUnitPromotionalImages,
	SetPromotionalImageUnits,
	SetUnitPromotionalImages,
	UpdatePromotionalImage,
} from "../../useCases";

export const PromotionalImagesController = new Elysia({ detail: { tags: ["Promotional images"] } })
	.use([GlobalPlugin])
	.decorate(({ prisma, ...injected }) => ({
		...injected,
		createPromotionalImage: new CreatePromotionalImage(prisma),
		deletePromotionalImage: new DeletePromotionalImage(prisma),
		listPromotionalImages: new ListPromotionalImages(prisma),
		listPromotionalImageUnits: new ListPromotionalImageUnits(prisma),
		listUnitPromotionalImages: new ListUnitPromotionalImages(prisma),
		prisma,
		setPromotionalImageUnits: new SetPromotionalImageUnits(prisma),
		setUnitPromotionalImages: new SetUnitPromotionalImages(prisma),
		updatePromotionalImage: new UpdatePromotionalImage(prisma),
	}))
	.get(
		"/promotional-images",
		async ({ listPromotionalImages, request }) => {
			const scope = await CompanyScopeGuard.execute(request.headers);
			CompanyScopeGuard.authorize(scope, "menu", "read");
			return listPromotionalImages.execute(scope.companyId);
		},
		{ response: PromotionalImageListReturn },
	)
	.post(
		"/promotional-images",
		async ({ body, createPromotionalImage, request }) => {
			const scope = await CompanyScopeGuard.execute(request.headers);
			CompanyScopeGuard.authorize(scope, "menu", "create");
			return createPromotionalImage.execute(scope.companyId, body);
		},
		{ body: CreatePromotionalImageBody, response: PromotionalImageReturn },
	)
	.patch(
		"/promotional-images/:promotionalImageId",
		async ({ body, params, request, updatePromotionalImage }) => {
			const scope = await CompanyScopeGuard.execute(request.headers);
			CompanyScopeGuard.authorize(scope, "menu", "update");
			return updatePromotionalImage.execute(scope.companyId, params.promotionalImageId, body);
		},
		{ body: UpdatePromotionalImageBody, response: PromotionalImageReturn },
	)
	.delete(
		"/promotional-images/:promotionalImageId",
		async ({ deletePromotionalImage, params, request }) => {
			const scope = await CompanyScopeGuard.execute(request.headers);
			CompanyScopeGuard.authorize(scope, "menu", "delete");
			await deletePromotionalImage.execute(scope.companyId, params.promotionalImageId);
			return { ok: true };
		},
		{ response: t.Object({ ok: t.Boolean() }) },
	)
	.get(
		"/promotional-images/:promotionalImageId/units",
		async ({ listPromotionalImageUnits, params, request }) => {
			const scope = await CompanyScopeGuard.execute(request.headers);
			CompanyScopeGuard.authorize(scope, "menu", "read");
			return listPromotionalImageUnits.execute(scope.companyId, params.promotionalImageId);
		},
		{ response: PromotionalImageUnitsReturn },
	)
	.put(
		"/promotional-images/:promotionalImageId/units",
		async ({ body, params, request, setPromotionalImageUnits }) => {
			const scope = await CompanyScopeGuard.execute(request.headers);
			CompanyScopeGuard.authorize(scope, "menu", "update");
			return setPromotionalImageUnits.execute(scope.companyId, params.promotionalImageId, body.unitIds);
		},
		{ body: SetPromotionalImageUnitsBody, response: PromotionalImageUnitsReturn },
	)
	.get(
		"/units/:unitId/promotional-images",
		async ({ listUnitPromotionalImages, params, request }) => {
			const scope = await CompanyScopeGuard.execute(request.headers);
			CompanyScopeGuard.authorize(scope, "units", "read");
			return listUnitPromotionalImages.execute(scope.companyId, params.unitId);
		},
		{ response: PromotionalImageListReturn },
	)
	.put(
		"/units/:unitId/promotional-images",
		async ({ body, params, request, setUnitPromotionalImages }) => {
			const scope = await CompanyScopeGuard.execute(request.headers);
			CompanyScopeGuard.authorize(scope, "units", "update");
			return setUnitPromotionalImages.execute(scope.companyId, params.unitId, body.promotionalImageIds);
		},
		{ body: SetUnitPromotionalImagesBody, response: PromotionalImageListReturn },
	);
