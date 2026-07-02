import Elysia from "elysia";
import { CompanyScopeGuard } from "@/modules/users/guards";
import { GlobalPlugin } from "@/shared/infra/elysia/global";
import { StaffListReturn } from "../../dtos";
import { ListStaff } from "../../useCases";

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
			),
	);
