import { mkdir } from "node:fs/promises";
import { CashbackController } from "./modules/cashback/infra";
import { DeliveriesController } from "./modules/deliveries/infra/elysia";
import { LoyaltyController } from "./modules/loyalty/infra";
import { PaymentsController } from "./modules/payments/infra";
import { CategoriesController } from "./modules/categories/infra";
import { CepController } from "./modules/cep/infra";
import { CouponsController } from "./modules/coupons/infra";
import { CompaniesController } from "./modules/companies/infra";
import { CustomersController } from "./modules/customers/infra";
import { ExampleController } from "./modules/example/infra";
import { OrdersController } from "./modules/orders/infra";
import { ProductsController } from "./modules/products/infra";
import { StaffController } from "./modules/staff/infra";
import { TagsController } from "./modules/tags/infra";
import { UnitProductsController } from "./modules/unitProducts/infra";
import { PublicUnitsController, UnitsController } from "./modules/units/infra";
import { UsersController } from "./modules/users/infra";
import { app } from "./shared/infra/elysia";

await mkdir(process.env.STATIC_DIR!, { recursive: true });

export const server = app.use([
	ExampleController,
	CompaniesController,
	UsersController,
	StaffController,
	UnitsController,
	PublicUnitsController,
	CategoriesController,
	TagsController,
	ProductsController,
	UnitProductsController,
	CashbackController,
	LoyaltyController,
	CepController,
	CouponsController,
	CustomersController,
	DeliveriesController,
	OrdersController,
	PaymentsController,
]);
