import Elysia from "elysia";
import { CompanyScopeGuard } from "@/modules/users/guards";
import { auth } from "@/shared/infra/betterAuth";
import { GlobalPlugin } from "@/shared/infra/elysia/global";
import { InviteStaffBody, StaffListReturn, StaffReturn } from "../../dtos";
import { InviteStaff, ListStaff } from "../../useCases";

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
			),
	);
