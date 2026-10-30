const PDF_URL_REVOKE_DELAY_MS = 60_000;

// Must be called synchronously inside the click handler, before any await, so mobile browsers don't treat it as a blocked popup.
export function openPdfWindow(): Window | null {
	return window.open("", "_blank");
}

export function showPdfBlob(blob: Blob, target: Window | null, filename: string) {
	const url = URL.createObjectURL(blob);
	window.setTimeout(() => URL.revokeObjectURL(url), PDF_URL_REVOKE_DELAY_MS);

	if (target && !target.closed) {
		target.location.href = url;
		return;
	}

	const link = document.createElement("a");
	link.href = url;
	link.download = filename;
	document.body.append(link);
	link.click();
	link.remove();
}
