import { DomainError } from "@/shared/errors";
import type { PrismaInstance } from "@/shared/infra/sql";
import type { InviteStaffDTO, StaffReturn } from "../dtos";
import { StaffErrors } from "../errors";

/** Creates the credentialed user; injected so the use-case stays unit-testable. */
export type SignUpFn = (input: {
	body: { email: string; name: string; password: string };
}) => Promise<{ user: { id: string } }>;

export type RequestPasswordResetFn = (input: {
	body: { email: string; redirectTo: string };
}) => Promise<unknown>;

export class InviteStaff {
	constructor(
		private readonly prisma: PrismaInstance,
		private readonly signUp: SignUpFn,
		private readonly requestPasswordReset: RequestPasswordResetFn,
	) {}

	async execute({ companyId, email, name, role, unitIds = [] }: InviteStaffDTO): Promise<StaffReturn> {
		if (!companyId) {
			throw new DomainError(StaffErrors.NO_COMPANY);
		}
		if (role !== "owner" && unitIds.length === 0) throw new DomainError(StaffErrors.COURIER_UNIT_REQUIRED);
		if (role !== "owner") await this.ensureCompanyUnits(companyId, unitIds);

		const existing = await this.prisma.user.findUnique({ where: { email } });
		if (existing) {
			throw new DomainError(StaffErrors.EMAIL_TAKEN);
		}

		const { user } = await this.signUp({ body: { email, name, password: crypto.randomUUID() } });

		const staff = await this.prisma.user.update({
			data: { companyId, role },
			select: { createdAt: true, email: true, id: true, name: true, role: true },
			where: { id: user.id },
		});
		if (role !== "owner" && unitIds.length > 0) {
			await this.prisma.staffUnit.createMany({
				data: unitIds.map(unitId => ({ unitId, userId: staff.id })),
			});
		}

		await this.requestPasswordReset({
			body: { email, redirectTo: `${process.env.APP_URL}/reset-password` },
		});

		return { ...staff, unitIds: role === "owner" ? [] : unitIds } as StaffReturn;
	}

	private async ensureCompanyUnits(companyId: string, unitIds: string[]) {
		const uniqueUnitIds = [...new Set(unitIds)];
		if (uniqueUnitIds.length === 0) return;

		const units = await this.prisma.unit.findMany({
			select: { id: true },
			where: { companyId, id: { in: uniqueUnitIds } },
		});
		if (units.length !== uniqueUnitIds.length) throw new DomainError(StaffErrors.UNIT_NOT_FOUND);
	}
}
