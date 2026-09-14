import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { getOrderReceiptLabels } from "../../orders/-receipt-labels";
import { SAMPLE_RECEIPT } from "./receipt-template";
import type { ReceiptTemplate } from "./types";

export function ReceiptPreview({ template }: { template: ReceiptTemplate }) {
	const { t } = useTranslation();
	const [url, setUrl] = useState("");

	useEffect(() => {
		let nextUrl = "";
		let cancelled = false;
		void import("../../orders/-order-receipt-pdf").then(({ createOrderReceiptPdf }) => {
			if (cancelled) return;
			const receipt = { ...SAMPLE_RECEIPT, template };
			const labels = getOrderReceiptLabels(t, receipt.payment?.method, receipt.payment?.status, receipt.status);
			nextUrl = URL.createObjectURL(createOrderReceiptPdf(receipt, labels).output("blob"));
			setUrl(nextUrl);
		});
		return () => {
			cancelled = true;
			if (nextUrl) URL.revokeObjectURL(nextUrl);
		};
	}, [t, template]);

	return (
		<div className="relative overflow-hidden rounded-xl border border-zinc-700 bg-zinc-900 p-4 shadow-2xl sm:p-6">
			<div className="pointer-events-none absolute inset-0 opacity-30 [background-image:radial-gradient(#71717a_0.7px,transparent_0.7px)] [background-size:7px_7px]" />
			<div className="relative mb-4 flex items-center justify-between text-zinc-300 text-xs uppercase tracking-[0.2em]">
				<span>{t("admin.receiptTemplate.preview.title")}</span>
				<span className="rounded-full border border-zinc-600 px-2 py-1">80 mm</span>
			</div>
			<div className="relative mx-auto w-full max-w-[340px] bg-white p-1 shadow-[0_20px_60px_rgba(0,0,0,0.45)]">
				{url && (
					<iframe
						className="h-[640px] w-full border-0 bg-white"
						src={`${url}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`}
						title={t("admin.receiptTemplate.preview.frameTitle")}
					/>
				)}
			</div>
		</div>
	);
}
