import { toast } from "react-toastify";

export function showToast(message: string, kind: "info" | "positive" | "warning" | "negative" = "info") {
	toast[kind === "positive" ? "success" : kind === "negative" ? "error" : kind](message);
}
