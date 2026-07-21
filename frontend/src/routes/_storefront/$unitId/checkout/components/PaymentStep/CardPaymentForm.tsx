import { useState } from "react";
import { useTranslation } from "react-i18next";
import { FaCcAmex, FaCcDiscover, FaCcMastercard, FaCcVisa, FaCreditCard } from "react-icons/fa";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/Checkbox";
import { Input } from "@/components/ui/input";
import { MaskedInput } from "@/components/ui/MaskedInput";
import { Label } from "@/components/ui/label";
import { useDebouncedInput } from "@/hooks/use-debounced-input";
import type { GetPaymentsCards200 } from "@/lib/api";
import { formatMoney } from "@/lib/formatMoney";

export interface CardPaymentValue {
	card?: {
		cvv: string;
		expMonth: number;
		expYear: number;
		holderName: string;
		number: string;
	};
	cardNickname?: string;
	cpf?: string;
	saveCard?: boolean;
	savedCardId?: string;
}

interface CardPaymentFormProps {
	amountCents: number;
	/** Customer profile still misses a CPF, so the form must collect one. */
	cpfRequired: boolean;
	isPending: boolean;
	onSubmit: (value: CardPaymentValue) => void;
	savedCards: GetPaymentsCards200;
}

function brandIcon(brand: string) {
	switch (brand.toLowerCase()) {
		case "visa":
			return FaCcVisa;
		case "mastercard":
			return FaCcMastercard;
		case "american express":
			return FaCcAmex;
		case "discover":
			return FaCcDiscover;
		default:
			return FaCreditCard;
	}
}

export function CardPaymentForm({
	amountCents,
	cpfRequired,
	isPending,
	onSubmit,
	savedCards,
}: CardPaymentFormProps) {
	const { t } = useTranslation();
	const [selected, setSelected] = useState<string>(savedCards[0]?.id ?? "new");
	const [holderName, setHolderName] = useState("");
	const [number, setNumber] = useState("");
	const [expiry, setExpiry] = useState("");
	const [cvv, setCvv] = useState("");
	const [cpf, setCpf] = useState("");
	const [saveCard, setSaveCard] = useState(true);
	const [cardNickname, setCardNickname] = useDebouncedInput("", () => undefined);

	const usingSavedCard = selected !== "new";

	const [expMonth, expYear] =
		expiry.length === 4 ? [Number(expiry.slice(0, 2)), 2000 + Number(expiry.slice(2))] : [0, 0];
	const validNewCard =
		holderName.trim().length >= 2 &&
		number.length >= 13 &&
		expMonth >= 1 &&
		expMonth <= 12 &&
		expYear >= new Date().getFullYear() &&
		cvv.length >= 3;
	const validCpf = !cpfRequired || cpf.length === 11;
	const canSubmit = validCpf && (usingSavedCard || validNewCard);

	function handleSubmit() {
		if (!canSubmit) return;
		onSubmit(
			usingSavedCard
				? { cpf: cpf || undefined, savedCardId: selected }
				: {
						card: { cvv, expMonth, expYear, holderName: holderName.trim(), number },
						cardNickname: saveCard ? cardNickname.trim() || undefined : undefined,
						cpf: cpf || undefined,
						saveCard,
					},
		);
	}

	return (
		<form
			className="space-y-4"
			onSubmit={event => {
				event.preventDefault();
				handleSubmit();
			}}
		>
			{savedCards.length > 0 && (
				<div className="space-y-2">
					{savedCards.map(card => {
						const Icon = brandIcon(card.brand);
						return (
							<label
								className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition-colors ${
									selected === card.id ? "border-primary bg-primary/5" : "border-border"
								}`}
								key={card.id}
							>
								<input
									checked={selected === card.id}
									className="size-4 accent-primary"
									name="payment-card"
									onChange={() => setSelected(card.id)}
									type="radio"
								/>
								<Icon className="size-6 text-muted-foreground" />
								<span className="flex-1 text-sm">
									{card.nickname ?? `•••• ${card.last4}`}
									<span className="ml-2 text-muted-foreground text-xs">
										{card.expiryMonth}/{card.expiryYear.slice(-2)}
									</span>
								</span>
							</label>
						);
					})}
					<label
						className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition-colors ${
							selected === "new" ? "border-primary bg-primary/5" : "border-border"
						}`}
					>
						<input
							checked={selected === "new"}
							className="size-4 accent-primary"
							name="payment-card"
							onChange={() => setSelected("new")}
							type="radio"
						/>
						<FaCreditCard className="size-6 text-muted-foreground" />
						<span className="text-sm">{t("store.checkout.payment.card.newCard")}</span>
					</label>
				</div>
			)}

			{!usingSavedCard && (
				<>
					<Label>
						{t("store.checkout.payment.card.holder")}
						<Input
							onChange={event => setHolderName(event.currentTarget.value)}
							placeholder={t("store.checkout.payment.card.holderPlaceholder")}
							value={holderName}
						/>
					</Label>

					<Label>
						{t("store.checkout.payment.card.number")}
						<div className="relative">
							<MaskedInput
								format="#### #### #### ####"
								inputMode="numeric"
								onValueChange={({ value: digits }) => setNumber(digits)}
								placeholder="0000 0000 0000 0000"
								value={number}
							/>
							<span className="absolute top-1/2 right-3 flex -translate-y-1/2 items-center gap-1 text-muted-foreground">
								<FaCcVisa className="size-5" />
								<FaCcMastercard className="size-5" />
							</span>
						</div>
					</Label>

					<div className="grid grid-cols-2 gap-4">
						<Label>
							{t("store.checkout.payment.card.cvc")}
							<MaskedInput
								format="####"
								inputMode="numeric"
								onValueChange={({ value: digits }) => setCvv(digits)}
								placeholder="123"
								value={cvv}
							/>
						</Label>
						<Label>
							{t("store.checkout.payment.card.expiry")}
							<MaskedInput
								format="##/##"
								inputMode="numeric"
								mask="_"
								onValueChange={({ value: digits }) => setExpiry(digits)}
								placeholder="MM/AA"
								value={expiry}
							/>
						</Label>
					</div>

					<label className="flex items-center gap-2 font-medium text-sm">
						<Checkbox checked={saveCard} onChange={event => setSaveCard(event.currentTarget.checked)} />
						{t("store.checkout.payment.card.save")}
					</label>
					{saveCard && (
						<Label>
							{t("store.checkout.payment.card.nickname")}
							<Input
								onChange={event => setCardNickname(event.currentTarget.value)}
								placeholder={t("store.checkout.payment.card.nicknamePlaceholder")}
								value={cardNickname}
							/>
						</Label>
					)}
				</>
			)}

			{cpfRequired && (
				<Label>
					{t("store.checkout.payment.cpf")}
					<MaskedInput
						format="###.###.###-##"
						inputMode="numeric"
						mask="_"
						onValueChange={({ value: digits }) => setCpf(digits)}
						placeholder={t("store.checkout.payment.cpfPlaceholder")}
						value={cpf}
					/>
				</Label>
			)}

			<Button className="w-full" disabled={!canSubmit || isPending} type="submit">
				{isPending
					? t("store.checkout.payment.card.paying")
					: t("store.checkout.payment.card.pay", { amount: formatMoney(amountCents / 100) })}
			</Button>
		</form>
	);
}
