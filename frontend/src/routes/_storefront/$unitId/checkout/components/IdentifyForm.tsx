import { useState } from "react";
import { useTranslation } from "react-i18next";
import { PatternFormat } from "react-number-format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";

type Channel = "email" | "sms" | "whatsapp";
type Step = "form" | "sms-code" | "email-sent";

interface IdentifyFormProps {
	unitSlug: string;
}

function toE164(digits: string) {
	return `+55${digits}`;
}

export function IdentifyForm({ unitSlug }: IdentifyFormProps) {
	const { t } = useTranslation();
	const [channel, setChannel] = useState<Channel>("sms");
	const [step, setStep] = useState<Step>("form");
	const [email, setEmail] = useState("");
	const [phoneDigits, setPhoneDigits] = useState("");
	const [code, setCode] = useState("");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	async function requestSms() {
		setError(null);
		setLoading(true);
		const { error: caught } = await authClient.phoneNumber.sendOtp({ phoneNumber: toE164(phoneDigits) });
		setLoading(false);
		if (caught) {
			setError(t("store.checkout.identify.errors.send"));
			return;
		}
		setStep("sms-code");
	}

	async function verifySms() {
		setError(null);
		setLoading(true);
		const { error: caught } = await authClient.phoneNumber.verify({ code, phoneNumber: toE164(phoneDigits) });
		setLoading(false);
		if (caught) {
			setError(t("store.checkout.identify.errors.code"));
			return;
		}
	}

	async function requestMagicLink() {
		setError(null);
		setLoading(true);
		const { error: caught } = await authClient.signIn.magicLink({ email, metadata: { unitId: unitSlug } });
		setLoading(false);
		if (caught) {
			setError(t("store.checkout.identify.errors.send"));
			return;
		}
		setStep("email-sent");
	}

	const channels: { key: Channel; label: string; disabled?: boolean }[] = [
		{ key: "sms", label: t("store.checkout.identify.channels.sms") },
		{ key: "email", label: t("store.checkout.identify.channels.email") },
		{ disabled: true, key: "whatsapp", label: t("store.checkout.identify.channels.whatsapp") },
	];

	return (
		<div className="space-y-4">
			<div className="flex gap-2">
				{channels.map(option => (
					<Button
						disabled={option.disabled}
						key={option.key}
						onClick={() => {
							setChannel(option.key);
							setStep("form");
							setError(null);
						}}
						size="sm"
						type="button"
						variant={channel === option.key ? "default" : "outline"}
					>
						{option.label}
						{option.disabled ? ` (${t("store.checkout.identify.channels.soon")})` : ""}
					</Button>
				))}
			</div>

			{channel === "sms" && step === "form" && (
				<form
					className="space-y-3"
					onSubmit={event => {
						event.preventDefault();
						void requestSms();
					}}
				>
					<Label>
						{t("store.checkout.identify.phone")}
						<PatternFormat
							customInput={Input}
							format="(##) #####-####"
							inputMode="numeric"
							mask="_"
							onValueChange={({ value: digits }) => setPhoneDigits(digits)}
							placeholder="(11) 91234-5678"
							value={phoneDigits}
						/>
					</Label>
					{error && <p className="text-destructive text-xs">{error}</p>}
					<Button className="w-full" disabled={loading || phoneDigits.length !== 11} type="submit">
						{loading ? t("store.checkout.identify.sending") : t("store.checkout.identify.sendCode")}
					</Button>
				</form>
			)}

			{channel === "sms" && step === "sms-code" && (
				<form
					className="space-y-3"
					onSubmit={event => {
						event.preventDefault();
						void verifySms();
					}}
				>
					<Label>
						{t("store.checkout.identify.code")}
						<Input
							inputMode="numeric"
							maxLength={6}
							onChange={event => setCode(event.currentTarget.value)}
							placeholder="123456"
							value={code}
						/>
					</Label>
					{error && <p className="text-destructive text-xs">{error}</p>}
					<Button className="w-full" disabled={loading || code.length !== 6} type="submit">
						{loading ? t("store.checkout.identify.verifying") : t("store.checkout.identify.verify")}
					</Button>
				</form>
			)}

			{channel === "email" && step === "form" && (
				<form
					className="space-y-3"
					onSubmit={event => {
						event.preventDefault();
						void requestMagicLink();
					}}
				>
					<Label>
						{t("store.checkout.identify.email")}
						<Input
							onChange={event => setEmail(event.currentTarget.value)}
							placeholder="voce@email.com"
							type="email"
							value={email}
						/>
					</Label>
					{error && <p className="text-destructive text-xs">{error}</p>}
					<Button className="w-full" disabled={loading || !email.includes("@")} type="submit">
						{loading ? t("store.checkout.identify.sending") : t("store.checkout.identify.sendLink")}
					</Button>
				</form>
			)}

			{channel === "email" && step === "email-sent" && (
				<p className="text-muted-foreground text-sm">{t("store.checkout.identify.linkSent", { email })}</p>
			)}
		</div>
	);
}
