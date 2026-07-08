import type { MenuItem } from "../../../components/types";

export type { MenuItem };
export type OptionGroup = MenuItem["optionGroups"][number];
export type Option = OptionGroup["options"][number];

export interface Selection {
	optionId: string;
	optionName: string;
	priceDeltaCents: number;
	quantity: number;
}

export type Selections = Record<string, Selection[]>;
