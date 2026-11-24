import { PaymentProviderError } from "@/shared/infra/paymentProviderError";
import { simpay, simpayIntegrationKey, type SimpayClient, type SimpayMerchantScope, type SimpayPaymentQuote, type SimpayPaymentQuoteInput } from "@/shared/infra/simpay";

type QuoteSource = Pick<SimpayClient, "quotePayment">;

let source: QuoteSource = simpay;

/** Tests inject a source so they never reach SimIntPay. */
export function setChargeQuoteSource(next: QuoteSource | null) {
	source = next ?? simpay;
}

export interface OrderChargeInput {
	/** `{ id, slug }` of the company, or its SimIntPay merchant scope. */
	company: { id: string; slug: string } | SimpayMerchantScope;
	deliveryAmountCents: number;
	/** Items after coupon, cashback and loyalty discounts; what the merchant keeps before SimIntPay fees. */
	itemsAmountCents: number;
	/** Line prices before order-level discounts, so SimIntPay can price per-product buyer fees. */
	items: { key: string; quantity: number; unitPrice: number }[];
	paymentMethod?: SimpayPaymentQuoteInput["paymentMethod"];
}

export class ChargeQuoteUnavailableError extends Error {
	constructor(readonly reason: unknown) {
		super(reason instanceof Error ? reason.message : "SimIntPay quote unavailable");
	}
}

/**
 * Buyer total for an order as SimIntPay will charge it. Delivery never prices buyer fees itself: the quote is the
 * only source of `total` and `buyerFeeTotalCents`. A zero base has nothing to charge online and is not quoted.
 */
export async function quoteOrderCharge(input: OrderChargeInput): Promise<SimpayPaymentQuote> {
	const baseAmountCents = input.itemsAmountCents + input.deliveryAmountCents;
	if (baseAmountCents <= 0) {
		return { additiveFeeCents: 0, additiveRevision: null, baseAmountCents: 0, buyerInterestCents: 0, feeMode: "ADDITIVE_ONLY", netAmountCents: 0, sellerFeeCents: 0, totalAmountCents: 0 };
	}
	try {
		return await source.quotePayment(
			"externalMerchantId" in input.company ? input.company : { externalMerchantId: input.company.id, integrationKey: simpayIntegrationKey(input.company.slug) },
			{
				amountCents: baseAmountCents,
				deliveryAmountCents: input.deliveryAmountCents,
				items: input.items.map(item => ({ key: item.key, quantity: item.quantity, unitPriceCents: item.unitPrice })),
				itemsAmountCents: input.itemsAmountCents,
				paymentMethod: input.paymentMethod ?? "PIX",
			},
		);
	} catch (error) {
		if (error instanceof PaymentProviderError) throw new ChargeQuoteUnavailableError(error);
		throw error;
	}
}
