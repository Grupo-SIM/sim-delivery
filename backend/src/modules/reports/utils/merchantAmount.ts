interface MerchantAmountOrder {
	feeTotalCents?: number | null;
	payment?: { coproductionCents?: number | null; simintpayFeeCents?: number | null } | null;
	total: number;
}

/** Company share of an order: total minus platform fees minus the coproducers' share frozen at payment. */
export function merchantAmount(order: MerchantAmountOrder) {
	return Math.max(0, order.total - (order.feeTotalCents ?? 0) - (order.payment?.coproductionCents ?? 0) - (order.payment?.simintpayFeeCents ?? 0));
}
