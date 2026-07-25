import { mkdir } from "node:fs/promises";
import { BrandingController } from "./modules/branding/infra";
import { CashbackController } from "./modules/cashback/infra";
import { CategoriesController } from "./modules/categories/infra";
import { CepController } from "./modules/cep/infra";
import { CompaniesController } from "./modules/companies/infra";
import { CouponsController } from "./modules/coupons/infra";
import { CustomersController } from "./modules/customers/infra";
import { DeliveriesController } from "./modules/deliveries/infra/elysia";
import { ExampleController } from "./modules/example/infra";
import { LoyaltyController } from "./modules/loyalty/infra";
import { MediaController } from "./modules/media/infra/elysia";
import { OrdersController } from "./modules/orders/infra";
import { PaymentsController } from "./modules/payments/infra";
import {
	ProductReviewsController,
	PublicProductReviewsController,
} from "./modules/productReviews/infra/elysia";
import { ProductsController } from "./modules/products/infra";
import { PromotionalImagesController } from "./modules/promotionalImages/infra";
import { ReportsController } from "./modules/reports/infra";
import { PublicReviewsController, ReviewsController } from "./modules/reviews/infra/elysia";
import { StaffController } from "./modules/staff/infra";
import { TagsController } from "./modules/tags/infra";
import { UnitProductsController } from "./modules/unitProducts/infra";
import { PublicUnitsController, UnitsController } from "./modules/units/infra";
import { UsersController } from "./modules/users/infra";
import { app } from "./shared/infra/elysia";

await mkdir(process.env.STATIC_DIR!, { recursive: true });

export const server = app.use([
	BrandingController,
	MediaController,
	ExampleController,
	CompaniesController,
	UsersController,
	StaffController,
	UnitsController,
	PublicUnitsController,
	CategoriesController,
	TagsController,
	ProductsController,
	PromotionalImagesController,
	UnitProductsController,
	CashbackController,
	LoyaltyController,
	CepController,
	CouponsController,
	CustomersController,
	DeliveriesController,
	OrdersController,
	PaymentsController,
	ReportsController,
	ReviewsController,
	PublicReviewsController,
	ProductReviewsController,
	PublicProductReviewsController,
]);
