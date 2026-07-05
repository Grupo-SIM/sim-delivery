import { DomainError } from "@/shared/errors";
import type { PrismaInstance } from "@/shared/infra/sql";
import type { InviteStaffDTO, StaffReturn } from "../dtos";
import { StaffErrors } from "../errors";

/** Creates the credentialed user; injected so the use-case stays unit-testable. */
export type SignUpFn = (input: {
	body: { email: string; name: string; password: string };
}) => Promise<{ user: { id: string } }>;

export class InviteStaff {
	constructor(
		private readonly prisma: PrismaInstance,
		private readonly signUp: SignUpFn,
	) {}

	async execute({ companyId, email, level, name, password, role = "employee" }: InviteStaffDTO): Promise<StaffReturn> {
		if (!companyId) {
			throw new DomainError(StaffErrors.NO_COMPANY);
		}

		const existing = await this.prisma.user.findUnique({ where: { email } });
		if (existing) {
			throw new DomainError(StaffErrors.EMAIL_TAKEN);
		}

		const { user } = await this.signUp({ body: { email, name, password } });

		const isCourier = role === "courier";
		const staff = await this.prisma.user.update({
			data: { companyId, level: isCourier ? null : level, role },
			select: { createdAt: true, email: true, id: true, level: true, name: true, role: true },
			where: { id: user.id },
		});

		return staff as StaffReturn;
	}
}
