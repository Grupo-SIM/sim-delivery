import type { GetPlatformFees200 } from "@/lib/api";

export type PlatformFee = GetPlatformFees200[number];
export type FeeScope = "order" | "product";
export type FeeDisplay = "checkout_only" | "embedded" | "product_explicit";

export interface FeeFormValue {
	active: boolean;
	applicationScope: FeeScope;
	displayMode: FeeDisplay;
	fixedValue: number;
	name: string;
	percentageValue: number;
}
