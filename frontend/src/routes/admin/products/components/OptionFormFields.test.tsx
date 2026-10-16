import { beforeEach, describe, expect, it, mock } from "bun:test";
import type { ReactElement } from "react";
import type { EditableOption } from "./OptionEditor";

const flushes: (() => void)[] = [];
mock.module("react-i18next", () => ({ useTranslation: () => ({ t: (key: string) => key }) }));
mock.module("@/hooks/use-debounced-input", () => ({
	useDebouncedInput: (value: string, onChange: (value: string) => void) => {
		const flush = () => onChange(value);
		flushes.push(flush);
		return [value, () => {}, flush];
	},
}));
mock.module("@/components/ui/Checkbox", () => ({ Checkbox: "checkbox" }));
mock.module("@/components/ui/input", () => ({ Input: "input" }));
mock.module("@/components/ui/label", () => ({ Label: "label", RequiredMark: "span" }));
mock.module("@/components/ui/MediaUrlInput", () => ({ MediaUrlInput: "media-input" }));
mock.module("@/components/ui/NumericInput", () => ({ NumericInput: "numeric-input" }));
mock.module("@/stores", () => ({ showToast: () => {} }));
const { OptionFormFields } = await import("./OptionFormFields");

beforeEach(() => {
	flushes.length = 0;
});
describe("option image draft", () => {
	it("keeps uploaded photo when other fields flush before save", () => {
		const option: EditableOption = {
			available: true,
			description: "Tradicional",
			id: "atum",
			imageUrl: null,
			name: "Atum",
			priceDeltaCents: 0,
			sortOrder: 0,
		};
		const draftRef = { current: option };
		let changed = option;
		const tree = OptionFormFields({
			draftRef,
			onChange: value => {
				changed = value;
			},
			onUploadingChange: () => {},
			option,
		});
		const fields = tree.props.children as ReactElement<{ children: ReactElement[] }>[];
		const media = fields[2].props.children[1] as ReactElement<{ onValueChange: (value: string) => void }>;
		media.props.onValueChange("https://example.com/atum.webp");
		flushes[0]();
		flushes[1]();
		expect(draftRef.current.imageUrl).toBe("https://example.com/atum.webp");
		expect(changed.imageUrl).toBe("https://example.com/atum.webp");
	});
});
