import { DomainError } from "@/shared/errors";
import type { PrismaInstance } from "@/shared/infra/sql";
import type { CustomerReturn, UpdateNotificationPreferencesBody } from "../dtos";
import { CustomerErrors } from "../errors";

export class UpdateNotificationPreferences {
	constructor(private readonly prisma: PrismaInstance) {}

	async execute(userId: string, data: UpdateNotificationPreferencesBody): Promise<CustomerReturn> {
		const customer = await this.prisma.customer.findUnique({ where: { userId } });
		if (!customer) throw new DomainError(CustomerErrors.CUSTOMER_NOT_FOUND);

		return this.prisma.customer.update({
			data: { notificationEmail: data.email, notificationWhatsApp: data.whatsApp },
			include: { addresses: { orderBy: { isDefault: "desc" }, where: { deletedAt: null } } },
			where: { id: customer.id },
		});
	}
}
