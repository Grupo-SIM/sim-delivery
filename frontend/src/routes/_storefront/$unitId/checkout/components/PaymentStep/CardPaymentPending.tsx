import { useCallback, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { LuLoaderCircle } from "react-icons/lu";
import { useGetPaymentsStatusByToken } from "@/lib/api";
import { paymentStatusClient } from "@/lib/api/payment-status-client";
import { usePaymentStatusEvents } from "./usePaymentStatusEvents";
import { showAlert } from "@/stores";

interface CardPaymentPendingProps {
	onConfirmed: () => void;
	onFailed: () => void;
	token: string;
}

export function CardPaymentPending({ onConfirmed, onFailed, token }: CardPaymentPendingProps) {
	const { t } = useTranslation();
	const settledRef = useRef(false);
	const { data } = useGetPaymentsStatusByToken(token, {
		client: { client: paymentStatusClient },
		query: {
			refetchInterval: query =>
				query.state.data?.status === "confirmed" || query.state.data?.status === "failed" ? false : 5_000,
			refetchIntervalInBackground: true,
			refetchOnWindowFocus: "always",
			refetchOnReconnect: "always",
		},
	});

	const settle = useCallback((status: string) => {
		if (settledRef.current) return;
		if (status === "confirmed") {
			settledRef.current = true;
			onConfirmed();
		}
		if (status === "failed") {
			settledRef.current = true;
			void showAlert(t("store.checkout.payment.card.errors.CARD_DECLINED"));
			onFailed();
		}
	}, [onConfirmed, onFailed, t]);

	usePaymentStatusEvents(token, settle);
	useEffect(() => {
		if (data) settle(data.status);
	}, [data, settle]);

	return (
		<div className="flex flex-col items-center gap-3 rounded-xl border border-border bg-card p-6 text-center">
			<LuLoaderCircle className="size-6 animate-spin text-primary" />
			<p className="font-semibold">{t("store.checkout.payment.card.pending")}</p>
			<p className="text-muted-foreground text-sm">{t("store.checkout.payment.card.pendingHint")}</p>
		</div>
	);
}
