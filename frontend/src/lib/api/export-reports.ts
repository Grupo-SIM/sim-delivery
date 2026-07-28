import ky from "ky";
import { branding } from "@/lib/branding";
import { slug } from "@/lib/variant";

export interface ExportReportsParams {
	endDate?: string;
	period?: string;
	startDate?: string;
	unitId?: string;
}

function getFileName(contentDisposition: string | null): string {
	const match = contentDisposition?.match(/filename="?([^"]+)"?/);
	return match?.[1] ?? `relatorio-${new Date().toISOString().slice(0, 10)}.xlsx`;
}

/**
 * Downloads the dashboard spreadsheet. Hand-written (not kubb-generated) because the response is a
 * binary workbook rather than JSON — same reason `upload-media` talks to `ky` directly.
 */
export async function exportReports(params: ExportReportsParams): Promise<void> {
	const searchParams = Object.entries(params).filter((entry): entry is [string, string] => Boolean(entry[1]));
	const response = await ky.get(`${branding.apiUrl}/reports/export`, {
		credentials: "include",
		headers: slug ? { "x-company-slug": slug } : undefined,
		searchParams,
		timeout: false,
	});
	const blob = await response.blob();
	const url = URL.createObjectURL(blob);
	const link = document.createElement("a");

	link.download = getFileName(response.headers.get("content-disposition"));
	link.href = url;
	document.body.append(link);
	link.click();
	link.remove();
	URL.revokeObjectURL(url);
}
