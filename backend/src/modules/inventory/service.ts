import { DomainError } from "@/shared/errors";
import type { PrismaInstance } from "@/shared/infra/sql";
import type {
	CreateInventoryItemBody,
	CreateInventoryMovementBody,
	ListInventoryItemsQuery,
	ListInventoryMovementsQuery,
	InventoryOverviewQuery,
	PutLocalOptionRecipeBody,
	PutProductRecipeBody,
	UpdateInventoryItemBody,
	UpdateInventorySettingsBody,
} from "./dtos";

const DEFAULT_SETTINGS = { consumptionWindowDays: 30, coverageTargetDays: 7 };
const number = (value: unknown) => Number(value ?? 0);
const normalizeItem = <T extends { unit: string }>(item: T) => ({ ...item, unit: item.unit as "unit" | "gram" | "milliliter" });

export class InventoryService {
	constructor(private readonly prisma: PrismaInstance) {}

	async listItems(companyId: string, query: ListInventoryItemsQuery) {
		const items = await this.prisma.inventoryItem.findMany({
			orderBy: { name: "asc" },
			where: {
				companyId,
				...(query.active === undefined ? {} : { active: query.active }),
				...(query.search ? { name: { contains: query.search, mode: "insensitive" } } : {}),
			},
		});
		return items.map(normalizeItem);
	}

	async createItem(companyId: string, body: CreateInventoryItemBody) {
		return normalizeItem(await this.prisma.inventoryItem.create({ data: { ...body, companyId, name: body.name.trim() } }));
	}

	async updateItem(companyId: string, itemId: string, body: UpdateInventoryItemBody) {
		const item = await this.prisma.inventoryItem.findFirst({ where: { companyId, id: itemId } });
		if (!item) throw new DomainError("INVENTORY_ITEM_NOT_FOUND");
		return normalizeItem(await this.prisma.inventoryItem.update({
			data: { ...body, ...(body.name ? { name: body.name.trim() } : {}) },
			where: { id: itemId },
		}));
	}

	async getSettings(companyId: string) {
		return this.prisma.inventorySettings.findUnique({ where: { companyId } }).then(settings => settings ?? DEFAULT_SETTINGS);
	}

	async updateSettings(companyId: string, body: UpdateInventorySettingsBody) {
		return this.prisma.inventorySettings.upsert({ create: { ...body, companyId }, update: body, where: { companyId } });
	}

	async createMovement(companyId: string, userId: string, body: CreateInventoryMovementBody) {
		const unit = await this.prisma.unit.findFirst({ where: { companyId, id: body.unitId } });
		const item = await this.prisma.inventoryItem.findFirst({ where: { companyId, id: body.inventoryItemId } });
		if (!unit || !item) throw new DomainError("INVENTORY_SCOPE_INVALID");
		if (body.type === "entry" && (body.quantity <= 0 || body.unitCostCents === undefined))
			throw new DomainError("INVENTORY_ENTRY_COST_REQUIRED");
		const delta = body.type === "entry" ? Math.abs(body.quantity) : body.type === "loss" ? -Math.abs(body.quantity) : body.quantity;

		return this.prisma.$transaction(async tx => {
			const current = await tx.unitInventoryBalance.upsert({
				create: { inventoryItemId: item.id, unitId: unit.id },
				update: {},
				where: { unitId_inventoryItemId: { inventoryItemId: item.id, unitId: unit.id } },
			});
			const oldQuantity = number(current.quantity);
			const nextQuantity = oldQuantity + delta;
			let averageCostCents = number(current.averageCostCents);
			if (body.type === "entry") {
				const costedOldQuantity = Math.max(0, oldQuantity);
				averageCostCents = costedOldQuantity === 0
					? body.unitCostCents!
					: (costedOldQuantity * averageCostCents + delta * body.unitCostCents!) / (costedOldQuantity + delta);
			}
			await tx.unitInventoryBalance.update({
				data: { averageCostCents, quantity: nextQuantity },
				where: { unitId_inventoryItemId: { inventoryItemId: item.id, unitId: unit.id } },
			});
			const movement = await tx.inventoryMovement.create({
				data: {
					balanceAfter: nextQuantity,
					inventoryItemId: item.id,
					quantity: delta,
					reason: body.reason.trim(),
					type: body.type,
					unitCostCents: body.unitCostCents,
					unitId: unit.id,
					userId,
				},
			});
			return { ...movement, balanceAfter: number(movement.balanceAfter), quantity: number(movement.quantity), unitCostCents: movement.unitCostCents === null ? null : number(movement.unitCostCents), inventoryItemName: item.name, unitName: unit.name };
		});
	}

	async listMovements(companyId: string, query: ListInventoryMovementsQuery) {
		const rows = await this.prisma.inventoryMovement.findMany({
			include: { inventoryItem: true, unit: true }, orderBy: { createdAt: "desc" },
			where: {
				unit: { companyId },
				...(query.unitId ? { unitId: query.unitId } : {}),
				...(query.inventoryItemId ? { inventoryItemId: query.inventoryItemId } : {}),
				...(query.type ? { type: query.type } : {}),
				...(query.search ? { reason: { contains: query.search, mode: "insensitive" } } : {}),
				...(query.startDate || query.endDate ? { createdAt: { ...(query.startDate ? { gte: new Date(query.startDate) } : {}), ...(query.endDate ? { lte: new Date(query.endDate) } : {}) } } : {}),
			},
		});
		return rows.map(row => ({ ...row, balanceAfter: number(row.balanceAfter), quantity: number(row.quantity), unitCostCents: row.unitCostCents === null ? null : number(row.unitCostCents), inventoryItemName: row.inventoryItem.name, unitName: row.unit.name }));
	}

	async overview(companyId: string, query: InventoryOverviewQuery) {
		const settings = await this.getSettings(companyId);
		const since = new Date(Date.now() - settings.consumptionWindowDays * 86_400_000);
		const [units, inventoryItems, balances, usages] = await Promise.all([
			this.prisma.unit.findMany({
				orderBy: { name: "asc" },
				where: { companyId, ...(query.unitId ? { id: query.unitId } : {}) },
			}),
			this.prisma.inventoryItem.findMany({
				orderBy: { name: "asc" },
				where: {
					active: true,
					companyId,
					...(query.search ? { name: { contains: query.search, mode: "insensitive" } } : {}),
				},
			}),
			this.prisma.unitInventoryBalance.findMany({
				where: {
					unit: { companyId },
					...(query.unitId ? { unitId: query.unitId } : {}),
					...(query.search ? { inventoryItem: { name: { contains: query.search, mode: "insensitive" } } } : {}),
				},
			}),
			this.prisma.inventoryMovement.groupBy({
				_sum: { quantity: true },
				by: ["unitId", "inventoryItemId"],
				where: { createdAt: { gte: since }, type: { in: ["consumption", "loss"] }, unit: { companyId } },
			}),
		]);
		const balancesByKey = new Map(balances.map(balance => [`${balance.unitId}:${balance.inventoryItemId}`, balance]));
		const usageByKey = new Map(usages.map(row => [`${row.unitId}:${row.inventoryItemId}`, Math.abs(number(row._sum.quantity))]));
		const items = units.flatMap(unit => inventoryItems.map(inventoryItem => {
			const balance = balancesByKey.get(`${unit.id}:${inventoryItem.id}`);
			const quantity = number(balance?.quantity);
			const reservedQuantity = number(balance?.reservedQuantity);
			const averageCostCents = number(balance?.averageCostCents);
			const available = quantity - reservedQuantity;
			const used = usageByKey.get(`${unit.id}:${inventoryItem.id}`) ?? 0;
			const consumptionPerDay = used / settings.consumptionWindowDays;
			const coverageDays = consumptionPerDay > 0 ? available / consumptionPerDay : null;
			return {
				alert: available <= 0 || (coverageDays !== null && coverageDays < settings.coverageTargetDays),
				averageCostCents,
				consumptionPerDay,
				coverageDays,
				inventoryItemId: inventoryItem.id,
				inventoryItemName: inventoryItem.name,
				quantity,
				reservedQuantity,
				unit: inventoryItem.unit as "unit" | "gram" | "milliliter",
				unitId: unit.id,
				unitName: unit.name,
				valueCents: quantity * averageCostCents,
			};
		}));
		const filtered = items.filter(item => query.status === undefined || query.status === "all" || (query.status === "low" && item.alert) || (query.status === "negative" && item.quantity - item.reservedQuantity <= 0) || (query.status === "no_history" && item.coverageDays === null));
		return { items: filtered, settings };
	}

	async getProductRecipe(companyId: string, productId: string) {
		const product = await this.prisma.product.findFirst({ where: { companyId, id: productId } });
		if (!product) throw new DomainError("PRODUCT_NOT_FOUND");
		const [ingredients, optionDeltas] = await Promise.all([
			this.prisma.productRecipeIngredient.findMany({ where: { productId } }),
			this.prisma.option.findMany({ include: { recipeIngredients: true }, where: { group: { productId } } }),
		]);
		return { ingredients: ingredients.map(row => ({ inventoryItemId: row.inventoryItemId, quantity: number(row.quantity) })), optionDeltas: optionDeltas.filter(option => option.recipeIngredients.length > 0).map(option => ({ optionId: option.id, ingredients: option.recipeIngredients.map(row => ({ inventoryItemId: row.inventoryItemId, quantityDelta: number(row.quantityDelta) })) })) };
	}

	async putProductRecipe(companyId: string, productId: string, body: PutProductRecipeBody) {
		const product = await this.prisma.product.findFirst({ where: { companyId, id: productId } });
		if (!product) throw new DomainError("PRODUCT_NOT_FOUND");
		const inventoryItemIds = [...new Set([
			...body.ingredients.map(row => row.inventoryItemId),
			...body.optionDeltas.flatMap(option => option.ingredients.map(row => row.inventoryItemId)),
		])];
		const validItems = await this.prisma.inventoryItem.count({ where: { active: true, companyId, id: { in: inventoryItemIds } } });
		if (validItems !== inventoryItemIds.length) throw new DomainError("INVENTORY_SCOPE_INVALID");
		const optionIds = body.optionDeltas.map(row => row.optionId);
		const validOptions = await this.prisma.option.count({ where: { group: { productId }, id: { in: optionIds } } });
		if (validOptions !== new Set(optionIds).size) throw new DomainError("INVALID_RECIPE_OPTION");
		await this.prisma.$transaction(async tx => {
			await tx.productRecipeIngredient.deleteMany({ where: { productId } });
			await tx.optionRecipeIngredient.deleteMany({ where: { option: { group: { productId } } } });
			if (body.ingredients.length) await tx.productRecipeIngredient.createMany({ data: body.ingredients.map(row => ({ ...row, productId })) });
			const deltas = body.optionDeltas.flatMap(option => option.ingredients.map(row => ({ ...row, optionId: option.optionId })));
			if (deltas.length) await tx.optionRecipeIngredient.createMany({ data: deltas });
		});
		return this.getProductRecipe(companyId, productId);
	}

	async getLocalOptionRecipe(companyId: string, unitProductId: string, localOptionId: string) {
		const option = await this.prisma.unitProductAdditionalOption.findFirst({ where: { id: localOptionId, unitProduct: { id: unitProductId, unit: { companyId } } } });
		if (!option) throw new DomainError("LOCAL_OPTION_NOT_FOUND");
		const ingredients = await this.prisma.localOptionRecipeIngredient.findMany({ where: { localOptionId } });
		return { ingredients: ingredients.map(row => ({ inventoryItemId: row.inventoryItemId, quantityDelta: number(row.quantityDelta) })) };
	}

	async putLocalOptionRecipe(companyId: string, unitProductId: string, localOptionId: string, body: PutLocalOptionRecipeBody) {
		await this.getLocalOptionRecipe(companyId, unitProductId, localOptionId);
		const inventoryItemIds = [...new Set(body.ingredients.map(row => row.inventoryItemId))];
		const validItems = await this.prisma.inventoryItem.count({ where: { active: true, companyId, id: { in: inventoryItemIds } } });
		if (validItems !== inventoryItemIds.length) throw new DomainError("INVENTORY_SCOPE_INVALID");
		await this.prisma.$transaction(async tx => {
			await tx.localOptionRecipeIngredient.deleteMany({ where: { localOptionId } });
			if (body.ingredients.length) await tx.localOptionRecipeIngredient.createMany({ data: body.ingredients.map(row => ({ ...row, localOptionId })) });
		});
		return this.getLocalOptionRecipe(companyId, unitProductId, localOptionId);
	}
}
