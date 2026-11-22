interface MerchantAmountOrder {
	feeTotalCents?: number | null;
	payment?: { coproductionCents?: number | null; netAmountCents?: number | null; simintpayFeeCents?: number | null } | null;
	total: number;
}

/**
 * Company share of an order, net of the coproducers' share frozen at payment. Charges priced by SimIntPay carry the
 * merchant net it returned (after its fees, before coproduction); historical rows keep deriving it from the order:
 * total minus platform fees minus SimIntPay fee.
 */
export function merchantAmount(order: MerchantAmountOrder) {
	const coproduction = order.payment?.coproductionCents ?? 0;
	const net = order.payment?.netAmountCents;
	if (net != null) return Math.max(0, net - coproduction);
	return Math.max(0, order.total - (order.feeTotalCents ?? 0) - coproduction - (order.payment?.simintpayFeeCents ?? 0));
}
