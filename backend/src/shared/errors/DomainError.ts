import type { StatusCodes } from "http-status-codes";
import { CashbackErrors, CashbackErrorsStatusCodes } from "@/modules/cashback/errors";
import { CategoryErrors, CategoryErrorsStatusCodes } from "@/modules/categories/errors";
import { CepErrors, CepErrorsStatusCodes } from "@/modules/cep/errors";
import { CompanyErrors, CompanyErrorsStatusCodes } from "@/modules/companies/errors";
import { CouponErrors, CouponErrorsStatusCodes } from "@/modules/coupons/errors";
import { CustomerErrors, CustomerErrorsStatusCodes } from "@/modules/customers/errors";
import { DeliveryErrors, DeliveryErrorsStatusCodes } from "@/modules/deliveries/errors";
import { ExampleErrors, ExampleErrorsStatusCodes } from "@/modules/example/errors";
import { InventoryErrors, InventoryErrorsStatusCodes } from "@/modules/inventory/errors";
import { LoyaltyErrors, LoyaltyErrorsStatusCodes } from "@/modules/loyalty/errors";
import { OrderErrors, OrderErrorsStatusCodes } from "@/modules/orders/errors";
import { PaymentErrors, PaymentErrorsStatusCodes } from "@/modules/payments/errors";
import { PlatformFeeErrors, PlatformFeeErrorsStatusCodes } from "@/modules/platformFees/errors";
import { ProductReviewErrors, ProductReviewErrorsStatusCodes } from "@/modules/productReviews/errors";
import { ProductErrors, ProductErrorsStatusCodes } from "@/modules/products/errors";
import {
	PromotionalImageErrors,
	PromotionalImageErrorsStatusCodes,
} from "@/modules/promotionalImages/errors";
import { ReviewErrors, ReviewErrorsStatusCodes } from "@/modules/reviews/errors";
import { StaffErrors, StaffErrorsStatusCodes } from "@/modules/staff/errors";
import { TagErrors, TagErrorsStatusCodes } from "@/modules/tags/errors";
import { UnitProductErrors, UnitProductErrorsStatusCodes } from "@/modules/unitProducts/errors";
import { UnitErrors, UnitErrorsStatusCodes } from "@/modules/units/errors";
import { UserErrors, UserErrorsStatusCodes } from "@/modules/users/errors";
import { WithdrawalErrors, WithdrawalErrorsStatusCodes } from "@/modules/withdrawals/errors";

export const DomainErrors = {
	...DeliveryErrors,
	...ExampleErrors,
	...ReviewErrors,
	...UserErrors,
	...CashbackErrors,
	...LoyaltyErrors,
	...PaymentErrors,
	...CompanyErrors,
	...CouponErrors,
	...CustomerErrors,
	...OrderErrors,
	...StaffErrors,
	...UnitErrors,
	...CategoryErrors,
	...TagErrors,
	...ProductErrors,
	...PromotionalImageErrors,
	...UnitProductErrors,
	...ProductReviewErrors,
	...CepErrors,
	...InventoryErrors,
	...PlatformFeeErrors,
	...WithdrawalErrors,
} as const;
export const DomainErrorsStatusCodes: Record<keyof typeof DomainErrors, StatusCodes> = {
	...DeliveryErrorsStatusCodes,
	...ExampleErrorsStatusCodes,
	...ReviewErrorsStatusCodes,
	...UserErrorsStatusCodes,
	...CashbackErrorsStatusCodes,
	...LoyaltyErrorsStatusCodes,
	...PaymentErrorsStatusCodes,
	...CompanyErrorsStatusCodes,
	...CouponErrorsStatusCodes,
	...CustomerErrorsStatusCodes,
	...OrderErrorsStatusCodes,
	...StaffErrorsStatusCodes,
	...UnitErrorsStatusCodes,
	...CategoryErrorsStatusCodes,
	...TagErrorsStatusCodes,
	...ProductErrorsStatusCodes,
	...PromotionalImageErrorsStatusCodes,
	...UnitProductErrorsStatusCodes,
	...ProductReviewErrorsStatusCodes,
	...CepErrorsStatusCodes,
	...InventoryErrorsStatusCodes,
	...PlatformFeeErrorsStatusCodes,
	...WithdrawalErrorsStatusCodes,
};

export class DomainError extends Error {
	status: number;

	constructor(
		message: keyof typeof DomainErrors,
		readonly description?: string,
	) {
		super(message);
		this.status = DomainErrorsStatusCodes[message];
	}
}
