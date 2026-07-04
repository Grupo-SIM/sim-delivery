import type { StatusCodes } from "http-status-codes";
import { CategoryErrors, CategoryErrorsStatusCodes } from "@/modules/categories/errors";
import { CepErrors, CepErrorsStatusCodes } from "@/modules/cep/errors";
import { CompanyErrors, CompanyErrorsStatusCodes } from "@/modules/companies/errors";
import { CustomerErrors, CustomerErrorsStatusCodes } from "@/modules/customers/errors";
import { ExampleErrors, ExampleErrorsStatusCodes } from "@/modules/example/errors";
import { OrderErrors, OrderErrorsStatusCodes } from "@/modules/orders/errors";
import { ProductErrors, ProductErrorsStatusCodes } from "@/modules/products/errors";
import { StaffErrors, StaffErrorsStatusCodes } from "@/modules/staff/errors";
import { TagErrors, TagErrorsStatusCodes } from "@/modules/tags/errors";
import { UnitProductErrors, UnitProductErrorsStatusCodes } from "@/modules/unitProducts/errors";
import { UnitErrors, UnitErrorsStatusCodes } from "@/modules/units/errors";
import { UserErrors, UserErrorsStatusCodes } from "@/modules/users/errors";

export const DomainErrors = {
	...ExampleErrors,
	...UserErrors,
	...CompanyErrors,
	...CustomerErrors,
	...OrderErrors,
	...StaffErrors,
	...UnitErrors,
	...CategoryErrors,
	...TagErrors,
	...ProductErrors,
	...UnitProductErrors,
	...CepErrors,
} as const;
export const DomainErrorsStatusCodes: Record<keyof typeof DomainErrors, StatusCodes> = {
	...ExampleErrorsStatusCodes,
	...UserErrorsStatusCodes,
	...CompanyErrorsStatusCodes,
	...CustomerErrorsStatusCodes,
	...OrderErrorsStatusCodes,
	...StaffErrorsStatusCodes,
	...UnitErrorsStatusCodes,
	...CategoryErrorsStatusCodes,
	...TagErrorsStatusCodes,
	...ProductErrorsStatusCodes,
	...UnitProductErrorsStatusCodes,
	...CepErrorsStatusCodes,
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
