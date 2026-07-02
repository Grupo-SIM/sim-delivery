import Elysia from "elysia";
import { GlobalPlugin } from "@/shared/infra/elysia/global";
import { CompanyScopeGuard } from "../../guards";
import { CompanyScopeReturn } from "../../guards/CompanyScopeGuard/types";

export const UsersController = new Elysia({
	detail: {
		tags: ["Users"],
	},
})
	.use([GlobalPlugin])
	.get("/me", async ({ request }) => CompanyScopeGuard.execute(request.headers), {
		response: CompanyScopeReturn,
	});
