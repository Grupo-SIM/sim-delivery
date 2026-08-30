import Elysia, { t } from "elysia";
import { CompanyScopeGuard } from "@/modules/users/guards";
import { auth } from "@/shared/infra/betterAuth";
import { GlobalPlugin } from "@/shared/infra/elysia/global";
import {
	InviteStaffBody,
	StaffListReturn,
	StaffReturn,
	UpdateStaffRoleBody,
	UpdateStaffUnitsBody,
} from "../../dtos";
import {
	InviteStaff,
	ListCouriers,
	ListStaff,
	RemoveStaff,
	UpdateStaffRole,
	UpdateStaffUnits,
} from "../../useCases";

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
				inviteStaff: new InviteStaff(
					prisma,
					input => auth.api.signUpEmail(input),
					input => auth.api.requestPasswordReset(input),
				),
				listCouriers: new ListCouriers(prisma),
				listStaff: new ListStaff(prisma),
				prisma,
				removeStaff: new RemoveStaff(prisma),
				updateStaffRole: new UpdateStaffRole(prisma),
				updateStaffUnits: new UpdateStaffUnits(prisma),
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
					if (body.role === "owner") CompanyScopeGuard.authorize(scope, "staff", "inviteOwner");
					CompanyScopeGuard.authorizeUnits(scope, body.unitIds ?? []);

					return inviteStaff.execute({ ...body, companyId: scope.companyId, unitIds: body.unitIds ?? [] });
				},
				{
					body: InviteStaffBody,
					response: StaffReturn,
				},
			)
			.put(
				"/:staffId/units",
				async ({ body, params, request, updateStaffUnits }) => {
					const scope = await CompanyScopeGuard.execute(request.headers);
					CompanyScopeGuard.authorize(scope, "staff", "setRole");
					CompanyScopeGuard.authorizeUnits(scope, body.unitIds);

					return updateStaffUnits.execute({
						...body,
						companyId: scope.companyId,
						staffId: params.staffId,
					});
				},
				{
					body: UpdateStaffUnitsBody,
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

					await removeStaff.execute(scope.companyId, params.staffId, scope.role === "superAdmin");

					return { ok: true };
				},
				{
					response: t.Object({ ok: t.Boolean() }),
				},
			),
	);
