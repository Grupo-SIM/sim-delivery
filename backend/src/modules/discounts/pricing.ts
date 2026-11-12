import type { PrismaInstance } from "@/shared/infra/sql";

/** Minimal discount shape the pricing rules need (matches the `discount` table). */
export interface DiscountRule {
	active: boolean;
	categoryIds: string[];
	endsAt: Date | null;
	id: string;
	kind: string;
	productIds: string[];
	startsAt: Date | null;
	tagIds: string[];
	type: string;
	unitIds: string[];
	value: number;
}

export interface DiscountTarget {
	/** Effective categories of the product at the unit (unit override or product default). */
	categoryIds: string[];
	productId: string;
	/** Effective tags of the product at the unit (unit override or product default). */
	tagIds: string[];
	unitId: string;
}

export interface DiscountedPrice {
	/** Applied discount id, when any. */
	discountId: string | null;
	/** Price the customer is actually charged. */
	priceCents: number;
	/** Struck-through reference price; equals `priceCents` when nothing is shown as discounted. */
	regularPriceCents: number;
}

export function isDiscountRunning(discount: DiscountRule, now: Date): boolean {
	return (
		discount.active &&
		(!discount.startsAt || discount.startsAt <= now) &&
		(!discount.endsAt || discount.endsAt > now)
	);
}

export function discountMatches(discount: DiscountRule, target: DiscountTarget): boolean {
	if (discount.unitIds.length > 0 && !discount.unitIds.includes(target.unitId)) return false;
	if (discount.productIds.length === 0 && discount.categoryIds.length === 0 && discount.tagIds.length === 0) {
		return true;
	}

	return (
		discount.productIds.includes(target.productId) ||
		target.categoryIds.some(categoryId => discount.categoryIds.includes(categoryId)) ||
		target.tagIds.some(tagId => discount.tagIds.includes(tagId))
	);
}

/** Real discount: amount taken off the charged price. Never goes below zero. */
function realSaving(discount: DiscountRule, priceCents: number): number {
	const saving = discount.type === "percent" ? Math.round((priceCents * discount.value) / 100) : discount.value;

	return Math.min(Math.max(saving, 0), priceCents);
}

/** Fake discount: the "de" price that makes `priceCents` look like `value%` (or `value` cents) off. */
function fakeRegularPrice(discount: DiscountRule, priceCents: number): number {
	if (discount.type === "percent") {
		return discount.value >= 100 ? priceCents : Math.round((priceCents * 100) / (100 - discount.value));
	}

	return priceCents + discount.value;
}

/**
 * Resolves the price of one menu item. Among the running, matching discounts the best real one
 * (largest saving) wins; fake discounts are only considered when no real one applies, picking the
 * highest displayed "de" price. Applies to the item's effective base price (promotional price
 * included); option deltas are never discounted.
 */
export function resolveDiscountedPrice(
	discounts: DiscountRule[],
	target: DiscountTarget,
	priceCents: number,
	now = new Date(),
): DiscountedPrice {
	const matching = discounts.filter(discount => isDiscountRunning(discount, now) && discountMatches(discount, target));

	let best: { discount: DiscountRule; saving: number } | undefined;
	for (const discount of matching.filter(item => item.kind === "real")) {
		const saving = realSaving(discount, priceCents);
		if (saving > 0 && (!best || saving > best.saving)) best = { discount, saving };
	}
	if (best) {
		return {
			discountId: best.discount.id,
			priceCents: priceCents - best.saving,
			regularPriceCents: priceCents,
		};
	}

	let fake: { discount: DiscountRule; regular: number } | undefined;
	for (const discount of matching.filter(item => item.kind === "fake")) {
		const regular = fakeRegularPrice(discount, priceCents);
		if (regular > priceCents && (!fake || regular > fake.regular)) fake = { discount, regular };
	}
	if (fake) return { discountId: fake.discount.id, priceCents, regularPriceCents: fake.regular };

	return { discountId: null, priceCents, regularPriceCents: priceCents };
}

/** Loads a company's discounts; tolerates stores without the table delegate (partial test doubles). */
export async function listCompanyDiscounts(prisma: PrismaInstance, companyId: string): Promise<DiscountRule[]> {
	const store = prisma as unknown as {
		discount?: { findMany: (args: { where: { active: true; companyId: string } }) => Promise<DiscountRule[]> };
	};

	return (await store.discount?.findMany({ where: { active: true, companyId } })) ?? [];
}
