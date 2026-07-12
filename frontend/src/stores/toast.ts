import { toaster } from "baseui/toast";

export function showToast(message: string, kind: "info" | "positive" | "warning" | "negative" = "info") {
	toaster[kind](message, { autoHideDuration: 4000 });
}
