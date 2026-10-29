import Elysia, { t } from "elysia";
import { AuthGuard } from "../../guards";
import { GlobalPlugin } from "@/shared/infra/elysia/global";
import { CompanyScopeGuard } from "../../guards";
import { CompanyScopeReturn } from "../../guards/CompanyScopeGuard/types";

export const UsersController = new Elysia({
	detail: {
		tags: ["Users"],
	},
})
	.use([GlobalPlugin])
	.post("/users/registration-event", async ({ request, prisma }) => {
        const user = await AuthGuard.execute(request.headers);
        const result = await prisma.user.updateMany({ where: { id: user.userId, registrationEventPendingAt: { gte: new Date(Date.now() - 30 * 60_000) } }, data: { registrationEventPendingAt: null } });
        return { created: result.count === 1, eventId: result.count === 1 ? `registration_${user.userId}` : null };
    }, { response: t.Object({ created: t.Boolean(), eventId: t.Nullable(t.String()) }) })
    .get("/me", async ({ request }) => CompanyScopeGuard.execute(request.headers), {
		response: CompanyScopeReturn,
	});
