import { DomainError } from "@/shared/errors";
import type { PrismaInstance } from "@/shared/infra/sql";
import type { CreateOptionBody, CreateOptionGroupBody, ProductOptionGroupsReturn, UpdateOptionBody, UpdateOptionGroupBody } from "../dtos";
import { ProductErrors } from "../errors";

function validateGroup(data: { minSelect?: number; maxSelect?: number; selectionType?: string }) {
	if (data.minSelect !== undefined && data.maxSelect !== undefined && data.minSelect > data.maxSelect) throw new DomainError(ProductErrors.INVALID_OPTION_RULES);
	if (data.selectionType === "single" && data.maxSelect !== undefined && data.maxSelect !== 1) throw new DomainError(ProductErrors.INVALID_OPTION_RULES);
}

export class ProductOptions {
	constructor(private readonly prisma: PrismaInstance) {}
	private async product(companyId: string | null, productId: string) {
		const product = await this.prisma.product.findFirst({ where: { ...(companyId ? { companyId } : {}), id: productId } });
		if (!product) throw new DomainError(ProductErrors.PRODUCT_NOT_FOUND);
		return product;
	}
	private async group(companyId: string | null, productId: string, groupId: string) {
		await this.product(companyId, productId);
		const group = await this.prisma.optionGroup.findFirst({ where: { id: groupId, productId } });
		if (!group) throw new DomainError(ProductErrors.INVALID_OPTION_GROUP);
		return group;
	}
	async list(companyId: string | null, productId: string): Promise<ProductOptionGroupsReturn> {
		await this.product(companyId, productId);
		return this.prisma.optionGroup.findMany({ include: { options: { orderBy: { sortOrder: "asc" } } }, orderBy: { sortOrder: "asc" }, where: { productId } });
	}
	async createGroup(companyId: string | null, productId: string, data: CreateOptionGroupBody) {
		await this.product(companyId, productId); validateGroup(data);
		return this.prisma.optionGroup.create({ data: { ...data, productId } });
	}
	async updateGroup(companyId: string | null, productId: string, groupId: string, data: UpdateOptionGroupBody) {
		const group = await this.group(companyId, productId, groupId); validateGroup({ ...group, ...data });
		return this.prisma.optionGroup.update({ data, where: { id: groupId } });
	}
	async deleteGroup(companyId: string | null, productId: string, groupId: string) { await this.group(companyId, productId, groupId); await this.prisma.optionGroup.delete({ where: { id: groupId } }); }
	async createOption(companyId: string | null, productId: string, groupId: string, data: CreateOptionBody) { await this.group(companyId, productId, groupId); return this.prisma.option.create({ data: { ...data, groupId } }); }
	async updateOption(companyId: string | null, productId: string, groupId: string, optionId: string, data: UpdateOptionBody) { await this.group(companyId, productId, groupId); const option = await this.prisma.option.findFirst({ where: { groupId, id: optionId } }); if (!option) throw new DomainError(ProductErrors.INVALID_OPTION_GROUP); return this.prisma.option.update({ data, where: { id: optionId } }); }
	async deleteOption(companyId: string | null, productId: string, groupId: string, optionId: string) { await this.updateOption(companyId, productId, groupId, optionId, {}); await this.prisma.option.delete({ where: { id: optionId } }); }
}
