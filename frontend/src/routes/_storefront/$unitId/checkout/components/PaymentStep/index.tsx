import { useQuery } from "@tanstack/react-query";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { FaCreditCard } from "react-icons/fa";
import { FaPix } from "react-icons/fa6";
import { Skeleton } from "@/components/ui/Skeleton";
import { getPaymentsCardsQueryOptions, usePostPaymentsCard } from "@/lib/api";
import { showAlert } from "@/stores";
import { CardPaymentForm, type CardPaymentValue } from "./CardPaymentForm";
import { CardPaymentPending } from "./CardPaymentPending";
import { PixPanel } from "./PixPanel";

type PaymentMethod = "card" | "pix";

interface PaymentStepProps {
	amountCents: number;
	/** CPF already stored on the customer profile, if any. */
	customerCpf: string | null;
	onConfirmed: () => void;
	orderId: string;
	slug: string;
}

export function PaymentStep({ amountCents, customerCpf, onConfirmed, orderId, slug }: PaymentStepProps) {
	const { t } = useTranslation();
	const [method, setMethod] = useState<PaymentMethod>("card");
	const [pixCpf, setPixCpf] = useState(customerCpf);
	const [cardPaymentToken, setCardPaymentToken] = useState<string | null>(null);

	const { data: savedCards, isPending: savedCardsPending } = useQuery(getPaymentsCardsQueryOptions({ slug }));
	const { isPending: isPayingCard, mutate: payWithCard } = usePostPaymentsCard();

	function handleCardSubmit(value: CardPaymentValue) {
		payWithCard(
			{ data: { ...value, orderId, slug } },
			{
				onError: error => {
					const message =
						error.data.description ??
						t(`store.checkout.payment.card.errors.${error.data.error}`, {
							defaultValue: t("store.checkout.payment.card.error"),
						});
					void showAlert(message);
				},
				onSuccess: payment => {
					if (payment.status === "confirmed") onConfirmed();
					else setCardPaymentToken(payment.token);
				},
			},
		);
	}

	const handleCardFailed = useCallback(() => setCardPaymentToken(null), []);

	const methods: { icon: typeof FaCreditCard; key: PaymentMethod; label: string }[] = [
		{ icon: FaCreditCard, key: "card", label: t("store.checkout.payment.methodCard") },
		{ icon: FaPix, key: "pix", label: t("store.checkout.payment.methodPix") },
	];

	return (
		<div className="space-y-4">
			<div className="grid grid-cols-2 gap-3">
				{methods.map(option => (
					<button
						className={`flex cursor-pointer flex-col items-start gap-1 rounded-xl border p-4 text-left transition-colors ${
							method === option.key
								? "border-primary bg-primary/5 text-foreground"
								: "border-border text-muted-foreground hover:border-primary/40"
						}`}
						key={option.key}
						onClick={() => setMethod(option.key)}
						type="button"
					>
						<option.icon className="size-5" />
						<span className="font-medium text-sm">{option.label}</span>
					</button>
				))}
			</div>

			{method === "card" && cardPaymentToken ? (
				<CardPaymentPending onConfirmed={onConfirmed} onFailed={handleCardFailed} token={cardPaymentToken} />
			) : method === "card" && savedCardsPending ? (
				<div className="space-y-3">
					<Skeleton className="h-12 w-full" />
					<Skeleton className="h-12 w-full" />
					<Skeleton className="h-12 w-full" />
				</div>
			) : (
				method === "card" && (
					<CardPaymentForm
						amountCents={amountCents}
						customerCpf={customerCpf}
						isPending={isPayingCard}
						onSubmit={handleCardSubmit}
						savedCards={savedCards ?? []}
					/>
				)
			)}

			{method === "pix" && (
				<PixPanel
					customerCpf={pixCpf}
					onConfirmed={onConfirmed}
					onCpfSaved={setPixCpf}
					orderId={orderId}
					slug={slug}
				/>
			)}
		</div>
	);
}
