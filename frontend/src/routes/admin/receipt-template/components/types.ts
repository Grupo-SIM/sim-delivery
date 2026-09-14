import type { GetReceiptTemplate200 } from "@/lib/api";

export type ReceiptTemplate = GetReceiptTemplate200;
export type ReceiptBlock = ReceiptTemplate["blocks"][number];
export type ReceiptBlockType = ReceiptBlock["type"];

export interface ReceiptBlockMeta {
	description: string;
	label: string;
}
