import type { ComponentPropsWithoutRef } from "react";
import { PatternFormat, type NumberFormatValues, type PatternFormatProps, type SourceInfo } from "react-number-format";
import { Input } from "@/components/ui/input";

type MaskedInputProps = Omit<PatternFormatProps<typeof Input>, "customInput" | "onValueChange"> & {
	onValueChange: (values: NumberFormatValues, sourceInfo: SourceInfo) => void;
};

/**
 * Shared masked input. Keep it directly controlled: react-number-format owns native
 * keyboard history, so browser shortcuts (Ctrl/Cmd+Z, Ctrl/Cmd+F) keep working.
 */
export function MaskedInput({ onValueChange, ...props }: MaskedInputProps) {
	return <PatternFormat customInput={Input} onValueChange={onValueChange} {...props} />;
}
