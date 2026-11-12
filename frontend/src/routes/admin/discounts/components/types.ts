export type DiscountKind = "fake" | "real";
export type DiscountType = "fixed" | "percent";

export interface DiscountFormState {
	endsAt: string;
	kind: DiscountKind;
	name: string;
	productIds: string[];
	startsAt: string;
	tagIds: string[];
	type: DiscountType;
	unitIds: string[];
	value: number;
}

export const emptyDiscountForm: DiscountFormState = {
	endsAt: "",
	kind: "real",
	name: "",
	productIds: [],
	startsAt: "",
	tagIds: [],
	type: "percent",
	unitIds: [],
	value: 0,
};

export function isDiscountFormValid(form: DiscountFormState): boolean {
	return form.name.trim() !== "" && form.value > 0 && (form.type !== "percent" || form.value < 100);
}
