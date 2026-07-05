import type { SignUpFn } from "@/modules/staff/useCases/InviteStaff";
import type { PrismaInstance } from "@/shared/infra/sql";

/** Bootstraps a single cross-tenant superAdmin from env vars; safe to call on every boot. */
export class SeedAdmin {
	constructor(
		private readonly prisma: PrismaInstance,
		private readonly signUp: SignUpFn,
	) {}

	async execute(): Promise<void> {
		const email = process.env.ADMIN_EMAIL;
		const password = process.env.ADMIN_PASSWORD;
		if (!email || !password) {
			return;
		}

		const name = process.env.ADMIN_NAME || "Admin";

		const existing = await this.prisma.user.findUnique({ where: { email } });
		if (existing) {
			await this.prisma.user.update({
				data: { companyId: null, level: null, role: "superAdmin" },
				where: { id: existing.id },
			});
			return;
		}

		const { user } = await this.signUp({ body: { email, name, password } });
		await this.prisma.user.update({
			data: { companyId: null, level: null, role: "superAdmin" },
			where: { id: user.id },
		});
	}
}
