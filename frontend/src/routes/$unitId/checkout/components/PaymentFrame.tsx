import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";

interface PaymentFrameProps {
	paymentUrl: string;
	onConfirmed: () => void;
}

export function PaymentFrame({ paymentUrl, onConfirmed }: PaymentFrameProps) {
	const { t } = useTranslation();
	const calledRef = useRef(false);

	useEffect(() => {
		function handleMessage(event: MessageEvent) {
			if (calledRef.current) return;
			if (event.data?.type === "payment_confirmed") {
				calledRef.current = true;
				onConfirmed();
			}
		}
		window.addEventListener("message", handleMessage);
		return () => window.removeEventListener("message", handleMessage);
	}, [onConfirmed]);

	return (
		<div className="space-y-3">
			<p className="text-muted-foreground text-sm">{t("store.checkout.payment.instructions")}</p>
			<iframe
				className="h-96 w-full rounded-md border border-border"
				src={paymentUrl}
				title={t("store.checkout.payment.title")}
			/>
		</div>
	);
}
