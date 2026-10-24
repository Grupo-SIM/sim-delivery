import { z } from "zod";

const optionalBooleanSearch = z
	.union([z.boolean(), z.enum(["true", "false"])])
	.transform(value => value === true || value === "true")
	.optional()
	.catch(undefined);

export const unitSearchSchema = z.object({
	menuOnly: optionalBooleanSearch,
	note: z.string().optional(),
	options: z.string().optional(),
	product: z.string().optional(),
	taxes: optionalBooleanSearch,
});
