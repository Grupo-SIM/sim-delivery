import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { LuCopy, LuCopyCheck, LuLoaderCircle } from "react-icons/lu";
import { Button } from "@/components/ui/button";
import { Label, RequiredMark } from "@/components/ui/label";
import { MaskedInput } from "@/components/ui/MaskedInput";
import { type PostPaymentsPix200, useGetPaymentsStatusByToken, usePostPaymentsPix } from "@/lib/api";
import { paymentStatusClient } from "@/lib/api/payment-status-client";
import { formatMoney } from "@/lib/formatMoney";
import { isValidCpf } from "@/lib/cpf";
import { showAlert } from "@/stores";
import { usePaymentStatusEvents } from "./usePaymentStatusEvents";

interface PixPanelProps {
	customerCpf: string | null;
	onConfirmed: () => void;
	onCpfSaved: (cpf: string) => void;
	orderId: string;
	slug: string;
}

export function PixPanel({ customerCpf, onConfirmed, onCpfSaved, orderId, slug }: PixPanelProps) {
	const { t } = useTranslation();
	const [pix, setPix] = useState<PostPaymentsPix200 | null>(null);
	const [copied, setCopied] = useState(false);
	const [failed, setFailed] = useState(false);
	const [cpf, setCpf] = useState(customerCpf ?? "");
	const confirmedRef = useRef(false);
	const requestedRef = useRef(false);

	const { isPending, mutateAsync: createPix } = usePostPaymentsPix();
	const cpfDigits = cpf.replace(/\D/g, "");
	const needsCpf = !customerCpf;

	const generate = useCallback(async () => {
		setFailed(false);
		confirmedRef.current = false;
		try {
			const payment = await createPix({ data: { cpf: cpfDigits || undefined, orderId, slug } });
			setPix(payment);
			if (cpfDigits) onCpfSaved(cpfDigits);
		} catch {
			setFailed(true);
			void showAlert(t("store.checkout.payment.pix.error"));
		}
	}, [cpfDigits, createPix, onCpfSaved, orderId, slug, t]);

	useEffect(() => {
		if (needsCpf || requestedRef.current) return;
		requestedRef.current = true;
		void generate();
	}, [generate, needsCpf]);

	const notifyConfirmed = useCallback(() => {
		if (confirmedRef.current) return;
		confirmedRef.current = true;
		onConfirmed();
	}, [onConfirmed]);
	usePaymentStatusEvents(pix?.token, status => {
		if (status === "confirmed") notifyConfirmed();
	});
	const { data: status } = useGetPaymentsStatusByToken(pix?.token, {
		client: { client: paymentStatusClient },
		query: {
			enabled: !!pix,
			refetchInterval: query => {
				if (query.state.data?.status === "confirmed") return false;
				return 5_000;
			},
			refetchIntervalInBackground: true,
			refetchOnWindowFocus: "always",
			refetchOnReconnect: "always",
		},
	});

	useEffect(() => {
		if (status?.status === "confirmed") notifyConfirmed();
	}, [notifyConfirmed, status?.status]);

	function copyContent() {
		if (!pix) return;
		void navigator.clipboard.writeText(pix.pixContent).then(() => {
			setCopied(true);
			setTimeout(() => setCopied(false), 2500);
		});
	}

	if (needsCpf && !pix) {
		return (
			<form
				className="space-y-4 rounded-xl border border-border bg-card p-4"
				onSubmit={event => {
					event.preventDefault();
					if (!isValidCpf(cpfDigits)) return;
					requestedRef.current = true;
					void generate();
				}}
			>
				<div className="space-y-1">
					<p className="font-semibold">{t("store.checkout.payment.pix.cpfTitle")}</p>
					<p className="text-muted-foreground text-sm">{t("store.checkout.payment.pix.cpfHint")}</p>
				</div>
				<Label>
					<span>
						{t("store.checkout.payment.cpf")} <RequiredMark />
					</span>
					<MaskedInput
						format="###.###.###-##"
						inputMode="numeric"
						mask="_"
						name="pix-cpf"
						onValueChange={({ formattedValue }) => {
							setCpf(formattedValue);
							setFailed(false);
						}}
						placeholder={t("store.checkout.payment.cpfPlaceholder")}
						value={cpf}
					/>
				</Label>
				{failed && <p className="text-destructive text-sm">{t("store.checkout.payment.pix.failedRetry")}</p>}
				<Button className="w-full" disabled={isPending || !isValidCpf(cpfDigits)} type="submit">
					{isPending ? t("store.checkout.payment.pix.generating") : t("store.checkout.payment.pix.generate")}
				</Button>
			</form>
		);
	}

	if (!pix && failed) {
		return (
			<div className="space-y-3 py-6 text-center">
				<p className="text-destructive text-sm">{t("store.checkout.payment.pix.failedRetry")}</p>
				<Button className="w-full" disabled={isPending} onClick={() => void generate()} type="button">
					{isPending ? t("store.checkout.payment.pix.generating") : t("store.checkout.payment.pix.retry")}
				</Button>
			</div>
		);
	}

	if (!pix) {
		return (
			<div className="flex items-center justify-center gap-2 py-10 text-muted-foreground text-sm">
				<LuLoaderCircle className="size-4 animate-spin" />
				{t("store.checkout.payment.pix.generating")}
			</div>
		);
	}

	return (
		<div className="space-y-4">
			<div className="flex flex-col items-center gap-3 rounded-xl border border-border bg-card p-4">
				<img
					alt={t("store.checkout.payment.pix.qrAlt")}
					className="size-52 rounded-lg bg-white p-2"
					src={pix.pixQrcode}
				/>
				<p className="font-semibold text-lg">{formatMoney(pix.amount / 100)}</p>
				<p className="text-center text-muted-foreground text-sm">{t("store.checkout.payment.pix.scan")}</p>
			</div>

			<div className="space-y-2">
				<p className="break-all rounded-md border border-border bg-muted/30 p-3 font-mono text-muted-foreground text-xs">
					{pix.pixContent}
				</p>
				<Button className="w-full" onClick={copyContent} type="button" variant="outline">
					{copied ? <LuCopyCheck className="size-4" /> : <LuCopy className="size-4" />}
					{copied ? t("store.checkout.payment.pix.copied") : t("store.checkout.payment.pix.copy")}
				</Button>
			</div>

			<div className="flex items-center justify-center gap-2 text-muted-foreground text-sm">
				<LuLoaderCircle className="size-4 animate-spin" />
				{t("store.checkout.payment.pix.waiting")}
			</div>
		</div>
	);
}
