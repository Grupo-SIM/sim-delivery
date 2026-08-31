import type { PrismaInstance } from "@/shared/infra/sql";
import type { GetReportsQuery, ProductProfitabilityItem, ProductProfitabilityReturn } from "../dtos";
import { GetBestSellers } from "./GetBestSellers";
import { CANCELLED } from "../utils/orderStatus";
import { getReportDateRange } from "../utils/reportPeriod";

const number = (value: unknown) => Number(value ?? 0);

/**
 * Profitability per product, combining what was actually sold (realized cost, from
 * OrderItem.costCents/netRevenueCents via GetBestSellers) with what the current recipe
 * would cost today (theoretical cost, from ProductRecipeIngredient × the current average
 * inventory cost) — products with no recipe configured surface that explicitly rather than
 * showing a misleading zero.
 */
export class GetProductProfitability {
	constructor(private readonly prisma: PrismaInstance) {}

	async execute(
		companyId: string | null,
		query: GetReportsQuery,
		permittedUnitIds?: string[],
	): Promise<ProductProfitabilityReturn> {
		const bestSellers = await new GetBestSellers(this.prisma).execute(companyId, query, null, permittedUnitIds);
		const bestSellerById = new Map(bestSellers.map(row => [row.productId, row]));

		const { endDate, period, startDate, unitId } = query;
		const now = new Date();
		const { since, until } = getReportDateRange(period, startDate, endDate, now);
		const unitFilter = unitId ? { unitId } : permittedUnitIds ? { unitId: { in: permittedUnitIds } } : {};
		const wastedRows = await this.prisma.orderItem.groupBy({
			_sum: { costCents: true },
			by: ["productId"],
			where: {
				order: {
					...(companyId ? { companyId } : {}),
					status: CANCELLED,
					...unitFilter,
					...(since || until
						? { createdAt: { ...(since ? { gte: since } : {}), ...(until ? { lt: until } : {}) } }
						: {}),
				},
			},
		});
		const wastedById = new Map(wastedRows.map(row => [row.productId, row._sum.costCents ?? 0]));

		const products = await this.prisma.product.findMany({
			select: {
				basePriceCents: true,
				id: true,
				recipeIngredients: {
					select: { inventoryItem: { select: { id: true, name: true, unit: true } }, quantity: true },
				},
				title: true,
				...(unitId
					? { unitProducts: { select: { priceCentsOverride: true, promotionalPriceCents: true }, where: { unitId } } }
					: {}),
			},
			where: {
				...(companyId ? { companyId } : {}),
				...(permittedUnitIds ? { unitProducts: { some: { unitId: { in: permittedUnitIds } } } } : {}),
			},
		});

		const ingredientIds = [
			...new Set(products.flatMap(product => product.recipeIngredients.map(row => row.inventoryItem.id))),
		];
		const balances = ingredientIds.length
			? unitId
				? await this.prisma.unitInventoryBalance.findMany({
						select: { averageCostCents: true, inventoryItemId: true },
						where: { inventoryItemId: { in: ingredientIds }, unitId },
					})
				: await this.prisma.unitInventoryBalance.groupBy({
						_avg: { averageCostCents: true },
						by: ["inventoryItemId"],
						where: {
							inventoryItemId: { in: ingredientIds },
							unit: { companyId: companyId ?? undefined },
							...(permittedUnitIds ? { unitId: { in: permittedUnitIds } } : {}),
						},
					})
			: [];
		const costByInventoryItem = new Map(
			balances.map(row =>
				unitId
					? [(row as { inventoryItemId: string }).inventoryItemId, number((row as { averageCostCents: unknown }).averageCostCents)]
					: [
							(row as { inventoryItemId: string }).inventoryItemId,
							number((row as { _avg: { averageCostCents: unknown } })._avg.averageCostCents),
						],
			),
		);

		const items: ProductProfitabilityItem[] = products.map(product => {
			const sold = bestSellerById.get(product.id);
			bestSellerById.delete(product.id);
			const priceCents = unitId
				? ((product as { unitProducts?: { priceCentsOverride: number | null; promotionalPriceCents: number | null }[] })
						.unitProducts?.[0]?.promotionalPriceCents ??
					(product as { unitProducts?: { priceCentsOverride: number | null }[] }).unitProducts?.[0]
						?.priceCentsOverride ??
					product.basePriceCents)
				: product.basePriceCents;

			const ingredients = product.recipeIngredients.map(row => {
				const unitCostCents = Math.round(costByInventoryItem.get(row.inventoryItem.id) ?? 0);
				const quantity = number(row.quantity);
				return {
					costCents: Math.round(unitCostCents * quantity),
					inventoryItemId: row.inventoryItem.id,
					name: row.inventoryItem.name,
					quantity,
					unit: row.inventoryItem.unit,
					unitCostCents,
				};
			});
			const hasRecipe = ingredients.length > 0;
			const theoreticalCostCents = hasRecipe
				? ingredients.reduce((sum, ingredient) => sum + ingredient.costCents, 0)
				: null;
			const totalIngredientCost = theoreticalCostCents ?? 0;
			const theoreticalProfitCents =
				theoreticalCostCents !== null ? priceCents - theoreticalCostCents : null;
			const theoreticalMarginPercent =
				theoreticalCostCents !== null && priceCents > 0
					? ((priceCents - theoreticalCostCents) / priceCents) * 100
					: null;

			return {
				grossMarginPercent: sold?.grossMarginPercent ?? null,
				grossProfitCents: sold?.grossProfitCents ?? 0,
				hasRecipe,
				ingredients: ingredients.map(ingredient => ({
					...ingredient,
					costSharePercent: totalIngredientCost > 0 ? (ingredient.costCents / totalIngredientCost) * 100 : 0,
				})),
				knownCostCents: sold?.knownCostCents ?? 0,
				knownNetRevenueCents: sold?.knownNetRevenueCents ?? 0,
				priceCents,
				productId: product.id,
				productName: product.title,
				theoreticalCostCents,
				theoreticalMarginPercent,
				theoreticalProfitCents,
				totalQuantity: sold?.totalQuantity ?? 0,
				totalRevenue: sold?.totalRevenue ?? 0,
				wastedCostCents: wastedById.get(product.id) ?? 0,
			};
		});

		// Products that were sold but no longer exist in the catalog still show up in the report.
		for (const sold of bestSellerById.values()) {
			items.push({
				grossMarginPercent: sold.grossMarginPercent,
				grossProfitCents: sold.grossProfitCents,
				hasRecipe: false,
				ingredients: [],
				knownCostCents: sold.knownCostCents,
				knownNetRevenueCents: sold.knownNetRevenueCents,
				priceCents: null,
				productId: sold.productId,
				productName: sold.productName,
				theoreticalCostCents: null,
				theoreticalMarginPercent: null,
				theoreticalProfitCents: null,
				totalQuantity: sold.totalQuantity,
				totalRevenue: sold.totalRevenue,
				wastedCostCents: wastedById.get(sold.productId) ?? 0,
			});
		}

		return items.sort((a, b) => b.totalRevenue - a.totalRevenue);
	}
}
