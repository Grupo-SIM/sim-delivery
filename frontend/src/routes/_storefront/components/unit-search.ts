import { z } from "zod";

export const unitSearchSchema = z.object({
	note: z.string().optional(),
	options: z.string().optional(),
	product: z.string().optional(),
});
