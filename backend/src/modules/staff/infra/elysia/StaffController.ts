import Elysia, { t } from "elysia";
import { CompanyScopeGuard } from "@/modules/users/guards";
import { auth } from "@/shared/infra/betterAuth";
import { GlobalPlugin } from "@/shared/infra/elysia/global";
import { InviteStaffBody, StaffListReturn, StaffReturn, UpdateStaffLevelBody } from "../../dtos";
import { InviteStaff, ListStaff, RemoveStaff, UpdateStaffLevel } from "../../useCases";

export const StaffController = new Elysia({
	detail: {
		tags: ["Staff"],
	},
})
	.use([GlobalPlugin])
	.group("/staff", app =>
		app
			.decorate(({ prisma, ...injected }) => ({
				...injected,
				inviteStaff: new InviteStaff(prisma, input => auth.api.signUpEmail(input)),
				listStaff: new ListStaff(prisma),
				prisma,
				removeStaff: new RemoveStaff(prisma),
				updateStaffLevel: new UpdateStaffLevel(prisma),
			}))
			.get(
				"/",
				async ({ listStaff, request }) => {
					const scope = await CompanyScopeGuard.execute(request.headers);
					CompanyScopeGuard.authorize(scope, "staff", "read");

					return listStaff.execute(scope.companyId);
				},
				{
					response: StaffListReturn,
				},
			)
			.post(
				"/",
				async ({ body, inviteStaff, request }) => {
					const scope = await CompanyScopeGuard.execute(request.headers);
					CompanyScopeGuard.authorize(scope, "staff", "invite");

					return inviteStaff.execute({ ...body, companyId: scope.companyId });
				},
				{
					body: InviteStaffBody,
					response: StaffReturn,
				},
			)
			.patch(
				"/:staffId",
				async ({ body, params, request, updateStaffLevel }) => {
					const scope = await CompanyScopeGuard.execute(request.headers);
					CompanyScopeGuard.authorize(scope, "staff", "setRole");

					return updateStaffLevel.execute({ ...body, companyId: scope.companyId, staffId: params.staffId });
				},
				{
					body: UpdateStaffLevelBody,
					response: StaffReturn,
				},
			)
			.delete(
				"/:staffId",
				async ({ params, removeStaff, request }) => {
					const scope = await CompanyScopeGuard.execute(request.headers);
					CompanyScopeGuard.authorize(scope, "staff", "remove");

					await removeStaff.execute(scope.companyId, params.staffId);

					return { ok: true };
				},
				{
					response: t.Object({ ok: t.Boolean() }),
				},
			),
	);
