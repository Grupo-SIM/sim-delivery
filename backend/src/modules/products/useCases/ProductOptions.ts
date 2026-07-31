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

		const existingGroups = await this.prisma.optionGroup.findMany({
			include: { options: true },
			where: { productId },
		});
		const existingGroupsById = new Map(existingGroups.map(group => [group.id, group]));
		const submittedGroupIds = new Set(data.groups.flatMap(group => (group.id ? [group.id] : [])));

		for (const group of data.groups) {
			if (group.id && !existingGroupsById.has(group.id))
				throw new DomainError(ProductErrors.INVALID_OPTION_GROUP);
		}

		const removedGroupIds = existingGroups
			.map(group => group.id)
			.filter(groupId => !submittedGroupIds.has(groupId));
		const operations = [];
		const optionUpdates: Array<{
			available: boolean;
			description: string;
			groupId: string;
			id: string;
			imageUrl: string | null;
			maxPerItem: number | null;
			name: string;
			priceDeltaCents: number;
			sortOrder: number;
		}> = [];

		for (const group of data.groups) {
			const groupData = {
				maxSelect: group.maxSelect,
				name: group.name,
				priceRule: group.priceRule,
				required: group.required,
				selectionType: group.selectionType,
				sortOrder: group.sortOrder,
			};
			const optionData = (option: (typeof group.options)[number]) => ({
				available: option.available,
				description: option.description,
				imageUrl: option.imageUrl,
				maxPerItem: option.maxPerItem,
				name: option.name,
				priceDeltaCents: option.priceDeltaCents,
				sortOrder: option.sortOrder,
			});
			const existingGroup = group.id ? existingGroupsById.get(group.id) : undefined;

			if (!existingGroup) {
				operations.push(
					this.prisma.optionGroup.create({
						data: {
							...groupData,
							options: { createMany: { data: group.options.map(optionData) } },
							productId,
						},
					}),
				);
				continue;
			}

			const existingOptionsById = new Map(existingGroup.options.map(option => [option.id, option]));
			for (const option of group.options) {
				if (option.id && !existingOptionsById.has(option.id))
					throw new DomainError(ProductErrors.INVALID_OPTION_GROUP);
			}

			const submittedOptionIds = new Set(
				group.options.flatMap(option => (option.id ? [option.id] : [])),
			);
			const removedOptionIds = existingGroup.options
				.map(option => option.id)
				.filter(optionId => !submittedOptionIds.has(optionId));

			operations.push(
				this.prisma.optionGroup.update({
					data: groupData,
					where: { id: existingGroup.id },
				}),
			);
			if (removedOptionIds.length) {
				operations.push(
					this.prisma.option.deleteMany({
						where: { groupId: existingGroup.id, id: { in: removedOptionIds } },
					}),
				);
			}

			const newOptions = group.options.filter(option => !option.id).map(optionData);
			if (newOptions.length) {
				operations.push(
					this.prisma.option.createMany({
						data: newOptions.map(option => ({ ...option, groupId: existingGroup.id })),
					}),
				);
			}

			for (const option of group.options) {
				if (!option.id) continue;
				const existingOption = existingOptionsById.get(option.id)!;
				const nextOption = {
					available: option.available ?? existingOption.available,
					description: option.description ?? existingOption.description,
					groupId: existingGroup.id,
					id: option.id,
					imageUrl: option.imageUrl === undefined ? existingOption.imageUrl : option.imageUrl,
					maxPerItem: option.maxPerItem === undefined ? existingOption.maxPerItem : option.maxPerItem,
					name: option.name ?? existingOption.name,
					priceDeltaCents: option.priceDeltaCents ?? existingOption.priceDeltaCents,
					sortOrder: option.sortOrder ?? existingOption.sortOrder,
				};
				if (
					nextOption.available !== existingOption.available ||
					nextOption.description !== existingOption.description ||
					nextOption.imageUrl !== existingOption.imageUrl ||
					nextOption.maxPerItem !== existingOption.maxPerItem ||
					nextOption.name !== existingOption.name ||
					nextOption.priceDeltaCents !== existingOption.priceDeltaCents ||
					nextOption.sortOrder !== existingOption.sortOrder
				) {
					optionUpdates.push(nextOption);
				}
			}
		}

		if (optionUpdates.length) {
			operations.push(
				this.prisma.$executeRawUnsafe(
					`UPDATE "option" AS target
					SET
						"available" = changes."available",
						"description" = changes."description",
						"imageUrl" = changes."imageUrl",
						"maxPerItem" = changes."maxPerItem",
						"name" = changes."name",
						"priceDeltaCents" = changes."priceDeltaCents",
						"sortOrder" = changes."sortOrder",
						"updatedAt" = CURRENT_TIMESTAMP
					FROM jsonb_to_recordset($1::jsonb) AS changes(
						"id" text,
						"groupId" text,
						"name" text,
						"description" text,
						"imageUrl" text,
						"maxPerItem" integer,
						"priceDeltaCents" integer,
						"available" boolean,
						"sortOrder" integer
					)
					WHERE target."id" = changes."id" AND target."groupId" = changes."groupId"`,
					JSON.stringify(optionUpdates),
				),
			);
		}

		await Promise.all([
			...(removedGroupIds.length
				? [this.prisma.optionGroup.deleteMany({ where: { id: { in: removedGroupIds }, productId } })]
				: []),
			...operations,
		]);

		return this.prisma.optionGroup.findMany({
			include: { options: { orderBy: { sortOrder: "asc" } } },
			orderBy: { sortOrder: "asc" },
			where: { productId },
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
