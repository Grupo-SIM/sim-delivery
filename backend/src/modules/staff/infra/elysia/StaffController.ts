import Elysia, { t } from "elysia";
import { CompanyScopeGuard } from "@/modules/users/guards";
import { auth } from "@/shared/infra/betterAuth";
import { GlobalPlugin } from "@/shared/infra/elysia/global";
import {
	InviteStaffBody,
	StaffListReturn,
	StaffReturn,
	UpdateCourierUnitsBody,
	UpdateStaffRoleBody,
} from "../../dtos";
import { InviteStaff, ListCouriers, ListStaff, RemoveStaff, UpdateCourierUnits, UpdateStaffRole } from "../../useCases";

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
				listCouriers: new ListCouriers(prisma),
				listStaff: new ListStaff(prisma),
				prisma,
				removeStaff: new RemoveStaff(prisma),
				updateCourierUnits: new UpdateCourierUnits(prisma),
				updateStaffRole: new UpdateStaffRole(prisma),
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
			.get(
				"/couriers",
				async ({ listCouriers, request }) => {
					const scope = await CompanyScopeGuard.execute(request.headers);
					CompanyScopeGuard.authorize(scope, "deliveries", "assign");

					return listCouriers.execute(scope.companyId);
				},
				{ response: StaffListReturn },
			)
			.post(
				"/",
				async ({ body, inviteStaff, request }) => {
					const scope = await CompanyScopeGuard.execute(request.headers);
					CompanyScopeGuard.authorize(scope, "staff", "invite");

					return inviteStaff.execute({ ...body, companyId: scope.companyId, unitIds: body.unitIds ?? [] });
				},
				{
					body: InviteStaffBody,
					response: StaffReturn,
				},
			)
			.put(
				"/:courierId/units",
				async ({ body, params, request, updateCourierUnits }) => {
					const scope = await CompanyScopeGuard.execute(request.headers);
					CompanyScopeGuard.authorize(scope, "staff", "setRole");

					return updateCourierUnits.execute({ ...body, companyId: scope.companyId, courierId: params.courierId });
				},
				{
					body: UpdateCourierUnitsBody,
					response: StaffReturn,
				},
			)
			.patch(
				"/:staffId",
				async ({ body, params, request, updateStaffRole }) => {
					const scope = await CompanyScopeGuard.execute(request.headers);
					CompanyScopeGuard.authorize(scope, "staff", "setRole");

					return updateStaffRole.execute({ ...body, companyId: scope.companyId, staffId: params.staffId });
				},
				{
					body: UpdateStaffRoleBody,
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
