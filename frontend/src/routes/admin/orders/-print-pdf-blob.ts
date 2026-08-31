const PRINT_FRAME_CLEANUP_DELAY_MS = 60_000;

export function printPdfBlob(blob: Blob): Promise<void> {
	return new Promise((resolve, reject) => {
		const url = URL.createObjectURL(blob);
		const frame = document.createElement("iframe");
		let cleanupTimeout: number | undefined;

		function cleanup() {
			if (cleanupTimeout !== undefined) window.clearTimeout(cleanupTimeout);
			frame.remove();
			URL.revokeObjectURL(url);
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
