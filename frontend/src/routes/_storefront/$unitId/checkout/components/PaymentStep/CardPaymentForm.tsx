import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { FaCcAmex, FaCcDiscover, FaCcMastercard, FaCcVisa, FaCreditCard } from "react-icons/fa";
import { LuEye, LuEyeOff } from "react-icons/lu";
import { Button } from "@/components/ui/button";
import { isValidCpf } from "@/lib/cpf";
import { Checkbox } from "@/components/ui/Checkbox";
import { Input } from "@/components/ui/input";
import { Label, RequiredMark } from "@/components/ui/label";
import { MaskedInput } from "@/components/ui/MaskedInput";
import { Tooltip } from "@/components/ui/Tooltip";
import { useDebouncedInput } from "@/hooks/use-debounced-input";
import type { GetPaymentsCards200 } from "@/lib/api";
import { formatMoney } from "@/lib/formatMoney";

export interface CardPaymentValue {
	replaceSavedCardId?: string;
	card?: {
		cvv: string;
		expMonth: number;
		expYear: number;
		holderName: string;
		number: string;
	};
	cardNickname?: string;
	holderCpf?: string;
	saveCard?: boolean;
	savedCardId?: string;
}

interface CardPaymentFormProps {
	reauthCardId?: string;
	amountCents: number;
	customerCpf: string | null;
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
	reauthCardId,
	amountCents,
	customerCpf,
	isPending,
	onSubmit,
	savedCards,
}: CardPaymentFormProps) {
	const { t } = useTranslation();
	const [selected, setSelected] = useState<string>(savedCards[0]?.id ?? "new");
	const [holderName, setHolderName] = useDebouncedInput("", () => undefined);
	const [number, setNumber] = useState("");
	const [expiry, setExpiry] = useState("");
	const [cvv, setCvv] = useState("");
	const [cvcVisible, setCvcVisible] = useState(false);
	const [holderCpf, setHolderCpf] = useState(customerCpf?.replace(/\D/g, "") ?? "");
	const [saveCard, setSaveCard] = useState(false);
	const [cardNickname, setCardNickname] = useDebouncedInput("", () => undefined);

	useEffect(() => { if (reauthCardId) { setSelected("new"); setSaveCard(false); } }, [reauthCardId]);
	const usingSavedCard = selected !== "new";
	const selectedSavedCard = savedCards.find(card => card.id === selected);
	const holderCpfRequired = !usingSavedCard || selectedSavedCard?.holderCpfRequired === true;

	const [expMonth, expYear] =
		expiry.length === 4 ? [Number(expiry.slice(0, 2)), 2000 + Number(expiry.slice(2))] : [0, 0];
	const validNewCard =
		holderName.trim().length >= 2 &&
		number.length >= 13 &&
		expMonth >= 1 &&
		expMonth <= 12 &&
		expYear >= new Date().getFullYear() &&
		cvv.length >= 3;
	const validCpf = !holderCpfRequired || isValidCpf(holderCpf);
	const canSubmit = validCpf && (usingSavedCard || validNewCard);

	function handleSubmit() {
		if (!canSubmit) return;
		onSubmit(
			usingSavedCard
				? { holderCpf: holderCpfRequired ? holderCpf : undefined, savedCardId: selected }
				: {
						card: { cvv, expMonth, expYear, holderName: holderName.trim(), number },
						replaceSavedCardId: saveCard ? reauthCardId : undefined,
						cardNickname: saveCard ? cardNickname.trim() || undefined : undefined,
						holderCpf,
						saveCard,
					},
		);
	}

	return (
		<form
			autoComplete="on"
			className="space-y-4"
			onSubmit={event => {
				event.preventDefault();
				handleSubmit();
			}}
		>
			{reauthCardId && <p className="text-muted-foreground text-sm">{t("store.checkout.payment.card.reauthHint")}</p>}
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
									{card.nickname ?? `${card.brand} •••• ${card.last4}`}
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
						<span>
							{t("store.checkout.payment.card.holder")} <RequiredMark />
						</span>
						<Input
							autoComplete="cc-name"
							name="cc-name"
							onChange={event => setHolderName(event.currentTarget.value)}
							placeholder={t("store.checkout.payment.card.holderPlaceholder")}
							value={holderName}
						/>
					</Label>

					<Label>
						<span>
							{t("store.checkout.payment.card.number")} <RequiredMark />
						</span>
						<div className="relative">
							<MaskedInput
								autoComplete="cc-number"
								className="pr-24"
								format="#### #### #### ####"
								inputMode="numeric"
								name="cc-number"
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
							<span>
								{t("store.checkout.payment.card.expiry")} <RequiredMark />
							</span>
							<MaskedInput
								autoComplete="cc-exp"
								format="##/##"
								inputMode="numeric"
								mask="_"
								name="cc-exp"
								onValueChange={({ value: digits }) => setExpiry(digits)}
								placeholder="MM/AA"
								value={expiry}
							/>
						</Label>
						<Label>
							<span>
								{t("store.checkout.payment.card.cvc")} <RequiredMark />
							</span>
							<div className="relative">
								<MaskedInput
									autoComplete="cc-csc"
									className="pr-12"
									format="####"
									inputMode="numeric"
									name="cc-csc"
									onValueChange={({ value: digits }) => setCvv(digits)}
									placeholder="123"
									type={cvcVisible ? "text" : "password"}
									value={cvv}
								/>
								<div className="absolute top-1/2 right-1.5 -translate-y-1/2">
									<Tooltip content={t(`store.checkout.payment.card.${cvcVisible ? "hideCvc" : "showCvc"}`)}>
										<Button
											aria-label={t(`store.checkout.payment.card.${cvcVisible ? "hideCvc" : "showCvc"}`)}
											className="size-8 p-0 text-muted-foreground"
											onClick={() => setCvcVisible(visible => !visible)}
											size="icon"
											type="button"
											variant="outline"
										>
											{cvcVisible ? <LuEyeOff className="size-4" /> : <LuEye className="size-4" />}
										</Button>
									</Tooltip>
								</div>
							</div>
						</Label>
					</div>

					<label className="flex cursor-pointer items-center gap-2 font-medium text-sm">
						<Checkbox checked={saveCard} onChange={event => setSaveCard(event.currentTarget.checked)} />
						{t(reauthCardId ? "store.checkout.payment.card.replaceSaved" : "store.checkout.payment.card.save")}
					</label>
					{saveCard && (
						<Label>
							{t("store.checkout.payment.card.nickname")}
							<Input
								autoComplete="off"
								name="card-nickname"
								onChange={event => setCardNickname(event.currentTarget.value)}
								placeholder={t("store.checkout.payment.card.nicknamePlaceholder")}
								value={cardNickname}
							/>
						</Label>
					)}
				</>
			)}

			{holderCpfRequired && (
				<Label>
					<span>
						{t("store.checkout.payment.card.holderCpf")} <RequiredMark />
					</span>
					<MaskedInput
						format="###.###.###-##"
						inputMode="numeric"
						mask="_"
						name="card-holder-cpf"
						onValueChange={({ value: digits }) => setHolderCpf(digits)}
						placeholder={t("store.checkout.payment.cpfPlaceholder")}
						value={holderCpf}
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
