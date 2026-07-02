import { mkdir } from "node:fs/promises";
import { CompaniesController } from "./modules/companies/infra";
import { ExampleController } from "./modules/example/infra";
import { StaffController } from "./modules/staff/infra";
import { UnitsController } from "./modules/units/infra";
import { UsersController } from "./modules/users/infra";
import { app } from "./shared/infra/elysia";

await mkdir(process.env.STATIC_DIR!, { recursive: true });

export const server = app.use([
	ExampleController,
	CompaniesController,
	UsersController,
	StaffController,
	UnitsController,
]);
