const PDF_URL_REVOKE_DELAY_MS = 60_000;
const PRINT_FRAME_CLEANUP_DELAY_MS = 60_000;

// Hidden-iframe printing only works where the browser renders PDFs inline in a frame (Chromium/Firefox on desktop).
// Safari and mobile browsers print a blank page there, so they get the PDF in a tab, where the native viewer prints/saves.
function canPrintInFrame(): boolean {
	if (typeof navigator === "undefined" || navigator.pdfViewerEnabled !== true) return false;
	const { userAgent } = navigator;
	const isMobile = /Android|iPhone|iPad|iPod|Mobile/i.test(userAgent) || navigator.maxTouchPoints > 1;
	const isSafari = /Safari/i.test(userAgent) && !/Chrome|Chromium|CriOS|FxiOS|Edg|OPR/i.test(userAgent);
	return !isMobile && !isSafari;
}

// Must be called synchronously inside the click handler, before any await, so popup blockers allow it.
export function prepareReceiptTarget(): Window | null {
	return canPrintInFrame() ? null : window.open("", "_blank");
}

function printInFrame(url: string, onDone: () => void): Promise<void> {
	return new Promise((resolve, reject) => {
		const frame = document.createElement("iframe");
		let cleanupTimeout: number | undefined;

		function cleanup() {
			if (cleanupTimeout !== undefined) window.clearTimeout(cleanupTimeout);
			frame.remove();
			onDone();
		}

		frame.setAttribute("aria-hidden", "true");
		frame.style.height = "1px";
		frame.style.position = "fixed";
		frame.style.right = "0";
		frame.style.visibility = "hidden";
		frame.style.width = "1px";

		frame.addEventListener(
			"load",
			() => {
				const printWindow = frame.contentWindow;
				if (!printWindow) {
					cleanup();
					reject(new Error("Print frame unavailable"));
					return;
				}

				try {
					printWindow.addEventListener("afterprint", cleanup, { once: true });
					printWindow.focus();
					cleanupTimeout = window.setTimeout(cleanup, PRINT_FRAME_CLEANUP_DELAY_MS);
					printWindow.print();
					resolve();
				} catch (error) {
					cleanup();
					reject(error);
				}
			},
			{ once: true },
		);
		frame.addEventListener(
			"error",
			() => {
				cleanup();
				reject(new Error("Could not load print frame"));
			},
			{ once: true },
		);

		frame.src = url;
		document.body.append(frame);
	});
}

function showInTab(url: string, target: Window | null, filename: string) {
	if (target && !target.closed) {
		target.location.href = url;
		return;
	}

	// Popup blocked: download instead.
	const link = document.createElement("a");
	link.href = url;
	link.download = filename;
	document.body.append(link);
	link.click();
	link.remove();
}

export async function printReceiptPdf(blob: Blob, target: Window | null, filename: string) {
	const url = URL.createObjectURL(blob);

	if (canPrintInFrame()) {
		try {
			await printInFrame(url, () => URL.revokeObjectURL(url));
			return;
		} catch {
			// Frame printing failed: fall through to the tab (popup may be blocked after the await, then it downloads).
			target = window.open("", "_blank");
		}
	}

	window.setTimeout(() => URL.revokeObjectURL(url), PDF_URL_REVOKE_DELAY_MS);
	showInTab(url, target, filename);
}
