import Elysia, { t } from "elysia";
import { CompanyScopeGuard } from "@/modules/users/guards";
import { GlobalPlugin } from "@/shared/infra/elysia/global";
import { CreateTagBody, TagListReturn, TagReturn, UpdateTagBody } from "../../dtos";
import { CreateTag, DeleteTag, ListTags, UpdateTag } from "../../useCases";

export const TagsController = new Elysia({
	detail: {
		tags: ["Tags"],
	},
})
	.use([GlobalPlugin])
	.group("/tags", app =>
		app
			.decorate(({ prisma, ...injected }) => ({
				...injected,
				createTag: new CreateTag(prisma),
				deleteTag: new DeleteTag(prisma),
				listTags: new ListTags(prisma),
				prisma,
				updateTag: new UpdateTag(prisma),
			}))
			.get(
				"/",
				async ({ listTags, request }) => {
					const scope = await CompanyScopeGuard.execute(request.headers);
					CompanyScopeGuard.authorize(scope, "menu", "read");

					return listTags.execute(scope.companyId, scope.role, scope.userId);
				},
				{ response: TagListReturn },
			)
			.post(
				"/",
				async ({ body, createTag, request }) => {
					const scope = await CompanyScopeGuard.execute(request.headers);
					CompanyScopeGuard.authorize(scope, "menu", "create");

					return createTag.execute(scope.companyId, body);
				},
				{ body: CreateTagBody, response: TagReturn },
			)
			.patch(
				"/:tagId",
				async ({ body, params, request, updateTag }) => {
					const scope = await CompanyScopeGuard.execute(request.headers);
					CompanyScopeGuard.authorize(scope, "menu", "update");

					return updateTag.execute(scope.companyId, params.tagId, body);
				},
				{ body: UpdateTagBody, response: TagReturn },
			)
			.delete(
				"/:tagId",
				async ({ deleteTag, params, request }) => {
					const scope = await CompanyScopeGuard.execute(request.headers);
					CompanyScopeGuard.authorize(scope, "menu", "delete");

					await deleteTag.execute(scope.companyId, params.tagId);

					return { ok: true };
				},
				{ response: t.Object({ ok: t.Boolean() }) },
			),
	);
