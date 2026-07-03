import type { GetProducts200 } from "@/lib/api";

export type Product = GetProducts200[number];

export interface ProductDraft {
	basePriceCents: number;
	cashbackPercentOverride: number | null;
	description: string;
	imageUrl: string;
	title: string;
}
