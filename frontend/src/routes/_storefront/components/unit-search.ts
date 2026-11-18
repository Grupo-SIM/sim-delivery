import { boolean, catch as catchValue, enum as zEnum, object, optional, pipe, string, transform, union } from "zod/mini";

const optionalBooleanSearch = catchValue(
	optional(
		pipe(
			union([boolean(), zEnum(["true", "false"])]),
			transform(value => value === true || value === "true"),
		),
	),
	undefined,
);

export const unitSearchSchema = object({
	menuOnly: optionalBooleanSearch,
	note: optional(string()),
	options: optional(string()),
	product: optional(string()),
	taxes: optionalBooleanSearch,
});
