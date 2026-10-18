import type { SignUpFn } from "@/modules/staff/useCases/InviteStaff";
import type { PrismaInstance } from "@/shared/infra/sql";

/** Bootstraps one owner for this deployment's company; safe to call on every boot. */
export class SeedOwner {
	constructor(
		private readonly prisma: PrismaInstance,
		private readonly signUp: SignUpFn,
	) {}

	async execute(): Promise<void> {
		const email = process.env.OWNER_EMAIL;
		const password = process.env.OWNER_PASSWORD;
		if (!email || !password) {
			return;
		}

		const name = process.env.OWNER_NAME || "Owner";
		const company = await this.prisma.company.findUnique({
			select: { id: true },
			where: { slug: process.env.COMPANY_SLUG },
		});
		if (!company) {
			return;
		}

		// Provision only a new company's first owner. Never promote, move or replace existing users.
		const owner = await this.prisma.user.findFirst({
			select: { id: true },
			where: { companyId: company.id, role: "owner" },
		});
		if (owner) return;
		const existing = await this.prisma.user.findUnique({ where: { email } });
		if (existing) return;

		const { user } = await this.signUp({ body: { email, name, password } });
		await this.prisma.user.update({
			data: { companyId: company.id, role: "owner" },
			where: { id: user.id },
		});
	}
}
