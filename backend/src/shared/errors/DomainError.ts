import type { StatusCodes } from "http-status-codes";
import { CompanyErrors, CompanyErrorsStatusCodes } from "@/modules/companies/errors";
import { ExampleErrors, ExampleErrorsStatusCodes } from "@/modules/example/errors";
import { StaffErrors, StaffErrorsStatusCodes } from "@/modules/staff/errors";
import { UnitErrors, UnitErrorsStatusCodes } from "@/modules/units/errors";
import { UserErrors, UserErrorsStatusCodes } from "@/modules/users/errors";

export const DomainErrors = {
	...ExampleErrors,
	...UserErrors,
	...CompanyErrors,
	...StaffErrors,
	...UnitErrors,
} as const;
export const DomainErrorsStatusCodes: Record<keyof typeof DomainErrors, StatusCodes> = {
	...ExampleErrorsStatusCodes,
	...UserErrorsStatusCodes,
	...CompanyErrorsStatusCodes,
	...StaffErrorsStatusCodes,
	...UnitErrorsStatusCodes,
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
