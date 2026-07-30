import { DomainError } from "@/shared/errors";
import type { PrismaInstance } from "@/shared/infra/sql";
import type {
	CreateOptionBody,
	CreateOptionGroupBody,
	ProductOptionGroupsReturn,
	SaveProductOptionGroupsBody,
	UpdateOptionBody,
	UpdateOptionGroupBody,
} from "../dtos";
import { ProductErrors } from "../errors";

function validateGroup(data: { maxSelect?: number; selectionType?: string }) {
	if (data.selectionType === "single" && data.maxSelect !== undefined && data.maxSelect !== 1)
		throw new DomainError(ProductErrors.INVALID_OPTION_RULES);
}

export class ProductOptions {
	constructor(private readonly prisma: PrismaInstance) {}
	private async product(companyId: string | null, productId: string) {
		const product = await this.prisma.product.findFirst({
			where: { ...(companyId ? { companyId } : {}), id: productId },
		});
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
		return this.prisma.optionGroup.findMany({
			include: { options: { orderBy: { sortOrder: "asc" } } },
			orderBy: { sortOrder: "asc" },
			where: { productId },
		});
	}
	async createGroup(companyId: string | null, productId: string, data: CreateOptionGroupBody) {
		await this.product(companyId, productId);
		validateGroup(data);
		return this.prisma.optionGroup.create({ data: { ...data, productId } });
	}
	async updateGroup(
		companyId: string | null,
		productId: string,
		groupId: string,
		data: UpdateOptionGroupBody,
	) {
		const group = await this.group(companyId, productId, groupId);
		validateGroup({ ...group, ...data });
		return this.prisma.optionGroup.update({ data, where: { id: groupId } });
	}
	async deleteGroup(companyId: string | null, productId: string, groupId: string) {
		await this.group(companyId, productId, groupId);
		await this.prisma.optionGroup.delete({ where: { id: groupId } });
	}
	async createOption(companyId: string | null, productId: string, groupId: string, data: CreateOptionBody) {
		await this.group(companyId, productId, groupId);
		return this.prisma.option.create({ data: { ...data, groupId } });
	}
	async save(companyId: string | null, productId: string, data: SaveProductOptionGroupsBody) {
		await this.product(companyId, productId);
		for (const group of data.groups) validateGroup(group);

		return this.prisma.$transaction(async tx => {
			const existingGroups = await tx.optionGroup.findMany({
				include: { options: true },
				where: { productId },
			});
			const existingGroupIds = new Set(existingGroups.map(group => group.id));
			const submittedGroupIds = new Set<string>();

			for (const group of data.groups) {
				if (group.id) submittedGroupIds.add(group.id);
				const groupData = {
					maxSelect: group.maxSelect,
					name: group.name,
					priceRule: group.priceRule,
					required: group.required,
					selectionType: group.selectionType,
					sortOrder: group.sortOrder,
				};
				const existingGroup = group.id ? existingGroups.find(item => item.id === group.id) : undefined;
				if (group.id && !existingGroup) throw new DomainError(ProductErrors.INVALID_OPTION_GROUP);
				const savedGroup = existingGroup
					? await tx.optionGroup.update({ data: groupData, where: { id: existingGroup.id } })
					: await tx.optionGroup.create({ data: { ...groupData, productId } });
				const existingOptions = existingGroup?.options ?? [];
				const existingOptionIds = new Set(existingOptions.map(option => option.id));
				const submittedOptionIds = new Set<string>();
				for (const option of group.options) if (option.id) submittedOptionIds.add(option.id);

				await tx.option.deleteMany({
					where: { groupId: savedGroup.id, id: { in: [...existingOptionIds].filter(id => !submittedOptionIds.has(id)) } },
				});
				for (const option of group.options) {
					const optionData = {
						available: option.available,
						description: option.description,
						imageUrl: option.imageUrl,
						maxPerItem: option.maxPerItem,
						name: option.name,
						priceDeltaCents: option.priceDeltaCents,
						sortOrder: option.sortOrder,
					};
					if (option.id && !existingOptionIds.has(option.id))
						throw new DomainError(ProductErrors.INVALID_OPTION_GROUP);
					if (option.id)
						await tx.option.update({ data: optionData, where: { id: option.id } });
					else await tx.option.create({ data: { ...optionData, groupId: savedGroup.id } });
				}
			}

			await tx.optionGroup.deleteMany({
				where: { id: { in: [...existingGroupIds].filter(id => !submittedGroupIds.has(id)) }, productId },
			});
			return tx.optionGroup.findMany({
				include: { options: { orderBy: { sortOrder: "asc" } } },
				orderBy: { sortOrder: "asc" },
				where: { productId },
			});
		});
	}
	async updateOption(
		companyId: string | null,
		productId: string,
		groupId: string,
		optionId: string,
		data: UpdateOptionBody,
	) {
		await this.group(companyId, productId, groupId);
		const option = await this.prisma.option.findFirst({ where: { groupId, id: optionId } });
		if (!option) throw new DomainError(ProductErrors.INVALID_OPTION_GROUP);
		return this.prisma.option.update({ data, where: { id: optionId } });
	}
	async deleteOption(companyId: string | null, productId: string, groupId: string, optionId: string) {
		await this.updateOption(companyId, productId, groupId, optionId, {});
		await this.prisma.option.delete({ where: { id: optionId } });
	}
}
