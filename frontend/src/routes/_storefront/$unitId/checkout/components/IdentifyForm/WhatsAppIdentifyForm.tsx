import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { LuCircleCheck, LuLoaderCircle } from "react-icons/lu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label, RequiredMark } from "@/components/ui/label";
import { MaskedInput } from "@/components/ui/MaskedInput";
import { useDebouncedInput } from "@/hooks/use-debounced-input";
import { authClient } from "@/lib/auth-client";
import { mapSessionUser, useAuthStore } from "@/stores/auth";
import { IdentifyError } from "./IdentifyError";
import { isValidOtp, toBrazilianE164 } from "./whatsapp-auth";

type Step = "phone" | "code";

export function WhatsAppIdentifyForm() {
	const { t } = useTranslation();
	const setUser = useAuthStore(state => state.setUser);
	const [step, setStep] = useState<Step>("phone");
	const [phone, setPhone] = useState("");
	const [code, setCode] = useDebouncedInput("", () => undefined);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [cooldown, setCooldown] = useState(0);
	const e164 = toBrazilianE164(phone);

	useEffect(() => {
		if (cooldown <= 0) return;
		const id = setTimeout(() => setCooldown(current => current - 1), 1000);
		return () => clearTimeout(id);
	}, [cooldown]);

	async function sendOtp() {
		if (!e164) return;
		setLoading(true);
		setError(null);
		try {
			const { error: sendError } = await authClient.phoneNumber.sendOtp({ phoneNumber: e164 });
			if (sendError) {
				setError(
					t(
						sendError.status === 429
							? "store.checkout.identify.errors.rateLimited"
							: "store.checkout.identify.errors.otpSend",
					),
				);
				return;
			}
			setCooldown(30);
			setStep("code");
		} catch {
			setError(t("store.checkout.identify.errors.otpSend"));
		} finally {
			setLoading(false);
		}
	}

	async function verifyOtp() {
		if (!e164 || !isValidOtp(code)) return;
		setLoading(true);
		setError(null);
		try {
			const { error: verifyError } = await authClient.phoneNumber.verify({
				code: code.replace(/\D/g, ""),
				phoneNumber: e164,
			});
			if (verifyError) {
				setError(t("store.checkout.identify.errors.otpInvalid"));
				return;
			}
			const session = await authClient.getSession();
			if (!session.data?.user) {
				setError(t("store.checkout.identify.errors.otpInvalid"));
				return;
			}
			setUser(mapSessionUser(session.data.user));
		} catch {
			setError(t("store.checkout.identify.errors.otpInvalid"));
		} finally {
			setLoading(false);
		}
	}

	if (step === "phone") {
		return (
			<form
				className="animate-slide-in-3d space-y-4"
				onSubmit={event => {
					event.preventDefault();
					void sendOtp();
				}}
			>
				<Label>
					<span>{t("store.checkout.identify.phone")} <RequiredMark /></span>
					<MaskedInput
						autoComplete="tel"
						format="+55 (##) #####-####"
						inputMode="tel"
						mask="_"
						name="phone"
						onValueChange={({ value }) => {
							setPhone(value);
							setError(null);
						}}
						placeholder="+55 (81) 99999-9999"
						value={phone}
					/>
				</Label>
				<p className="text-muted-foreground text-xs">{t("store.checkout.identify.phoneHint")}</p>
				{error && <IdentifyError>{error}</IdentifyError>}
				<Button className="h-12 w-full rounded-pill font-bold text-base" disabled={loading || !e164} type="submit">
					{loading && <LuLoaderCircle className="size-4 animate-spin" />}
					{t(loading ? "store.checkout.identify.sending" : "store.checkout.identify.sendCode")}
				</Button>
			</form>
		);
	}

	return (
		<form
			className="animate-slide-in-3d space-y-4"
			onSubmit={event => {
				event.preventDefault();
				void verifyOtp();
			}}
		>
			<div className="flex items-center gap-2 rounded-lg border border-success/30 bg-success/10 px-3.5 py-2.5 text-success text-sm"><LuCircleCheck className="size-4 shrink-0" />{t("store.checkout.identify.otpSent")}</div>
			<Label>
				<span>{t("store.checkout.identify.code")} <RequiredMark /></span>
				<Input
					autoComplete="one-time-code"
					inputMode="numeric"
					maxLength={6}
					name="one-time-code"
					onChange={event => {
						setCode(event.currentTarget.value.replace(/\D/g, ""));
						setError(null);
					}}
					placeholder={t("store.checkout.identify.codePlaceholder")}
					type="text"
					value={code}
				/>
			</Label>
			{error && <IdentifyError>{error}</IdentifyError>}
			<Button className="h-12 w-full rounded-pill font-bold text-base" disabled={loading || !isValidOtp(code)} type="submit">
				{loading && <LuLoaderCircle className="size-4 animate-spin" />}
				{t(loading ? "store.checkout.identify.verifying" : "store.checkout.identify.verifyCode")}
			</Button>
			<Button className="h-11 w-full" disabled={loading || cooldown > 0} onClick={() => void sendOtp()} type="button" variant="outline">
				{cooldown > 0 ? t("store.checkout.identify.resendIn", { seconds: cooldown }) : t("store.checkout.identify.resendCode")}
			</Button>
			<Button className="h-11 w-full" onClick={() => { setStep("phone"); setCode(""); setError(null); }} type="button" variant="outline">{t("store.checkout.identify.changePhone")}</Button>
		</form>
	);
}
