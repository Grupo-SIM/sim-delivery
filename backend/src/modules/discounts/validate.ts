import { DomainError } from "@/shared/errors";
import { DiscountErrors } from "./errors";

/** Cross-field rules the body schema can't express: value range per type, fake = percent-only-or-fixed, period order. */
export function assertValidDiscount(discount: {
	endsAt?: Date | null;
	startsAt?: Date | null;
	type: string;
	value: number;
}) {
	if (discount.type === "percent" && discount.value > 99) {
		throw new DomainError(DiscountErrors.INVALID_DISCOUNT_VALUE);
	}
	if (discount.startsAt && discount.endsAt && discount.endsAt <= discount.startsAt) {
		throw new DomainError(DiscountErrors.INVALID_DISCOUNT_PERIOD);
	}
}
