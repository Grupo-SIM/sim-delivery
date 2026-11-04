import { invoke, isTauri } from "@tauri-apps/api/core";

export interface NativePrinter {
	isDefault: boolean;
	name: string;
}

/** Silent printing is only available in the Tauri desktop shell. */
export const canPrintNatively = () => isTauri();

export async function listNativePrinters(): Promise<NativePrinter[]> {
	const printers = await invoke<{ is_default: boolean; name: string }[]>("list_printers");
	return printers.map(({ is_default, name }) => ({ isDefault: is_default, name }));
}

/** Sends a PDF to the named printer without showing any dialog. */
export async function printPdfNatively(printer: string, pdf: Blob): Promise<void> {
	const bytes = Array.from(new Uint8Array(await pdf.arrayBuffer()));
	await invoke("print_pdf", { pdf: bytes, printer });
}
