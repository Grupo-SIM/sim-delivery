import type { StatusCodes } from "http-status-codes";
import { CategoryErrors, CategoryErrorsStatusCodes } from "@/modules/categories/errors";
import { CompanyErrors, CompanyErrorsStatusCodes } from "@/modules/companies/errors";
import { ExampleErrors, ExampleErrorsStatusCodes } from "@/modules/example/errors";
import { ProductErrors, ProductErrorsStatusCodes } from "@/modules/products/errors";
import { StaffErrors, StaffErrorsStatusCodes } from "@/modules/staff/errors";
import { TagErrors, TagErrorsStatusCodes } from "@/modules/tags/errors";
import { UnitErrors, UnitErrorsStatusCodes } from "@/modules/units/errors";
import { UserErrors, UserErrorsStatusCodes } from "@/modules/users/errors";

export const DomainErrors = {
	...ExampleErrors,
	...UserErrors,
	...CompanyErrors,
	...StaffErrors,
	...UnitErrors,
	...CategoryErrors,
	...TagErrors,
	...ProductErrors,
} as const;
export const DomainErrorsStatusCodes: Record<keyof typeof DomainErrors, StatusCodes> = {
	...ExampleErrorsStatusCodes,
	...UserErrorsStatusCodes,
	...CompanyErrorsStatusCodes,
	...StaffErrorsStatusCodes,
	...UnitErrorsStatusCodes,
	...CategoryErrorsStatusCodes,
	...TagErrorsStatusCodes,
	...ProductErrorsStatusCodes,
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
