import type { MenuItem } from "../types";

export type ProductOptionGroup = MenuItem["optionGroups"][number];
export type ProductOption = ProductOptionGroup["options"][number];

export interface OptionImagePreview {
	alt: string;
	imageUrl: string;
}
