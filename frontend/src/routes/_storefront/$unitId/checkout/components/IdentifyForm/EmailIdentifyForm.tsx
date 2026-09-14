import { useEffect, useState } from "react";
import { Trans, useTranslation } from "react-i18next";
import { LuCircleCheck, LuLoaderCircle, LuMail } from "react-icons/lu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label, RequiredMark } from "@/components/ui/label";
import { requestMagicLink as sendMagicLinkRequest } from "@/lib/request-magic-link";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth";
import { IdentifyError } from "./IdentifyError";

type AccessMethod = "magic-link" | "password";
type Step = "form" | "email-sent";

export function EmailIdentifyForm({ unitSlug }: { unitSlug?: string }) {
	const { t } = useTranslation();
	const signIn = useAuthStore(state => state.signIn);
	const [accessMethod, setAccessMethod] = useState<AccessMethod>("magic-link");
	const [step, setStep] = useState<Step>("form");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [cooldown, setCooldown] = useState(0);
	const [resent, setResent] = useState(false);
	const emailIsValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

	useEffect(() => {
		if (cooldown <= 0) return;
		const id = setTimeout(() => setCooldown(current => current - 1), 1000);
		return () => clearTimeout(id);
	}, [cooldown]);

	async function requestMagicLink(isResend = false) {
		setError(null);
		setLoading(true);
		try {
			await sendMagicLinkRequest({ email, metadata: { unitId: unitSlug ?? "" } });
			setCooldown(30);
			setResent(isResend);
			setStep("email-sent");
		} catch {
			setError(t("store.checkout.identify.errors.send"));
		} finally {
			setLoading(false);
		}
	}

	async function signInWithPassword() {
		setError(null);
		setLoading(true);
		await signIn({
			defaultUserName: "Cliente",
			email,
			invalidCredentialsMessage: t("store.checkout.identify.errors.invalidCredentials"),
			password,
		});
		const signInError = useAuthStore.getState().error;
		if (signInError) setError(signInError);
		setLoading(false);
	}

	if (step === "email-sent") {
		return (
			<div className="animate-slide-in-3d space-y-4 text-center">
				<div className="mx-auto flex size-14 items-center justify-center rounded-full bg-success/15 text-success">
					<LuCircleCheck className="size-7" />
				</div>
				<div className="space-y-1.5">
					<p className="font-bold text-foreground text-lg">{t("store.checkout.identify.linkSentTitle")}</p>
					<p className="text-muted-foreground text-sm">
						<Trans
							components={{ strong: <strong className="font-semibold text-foreground" /> }}
							i18nKey="store.checkout.identify.linkSent"
							values={{ email }}
						/>
					</p>
				</div>
				{resent && !loading && <p className="font-medium text-success text-xs">{t("store.checkout.identify.linkResent")}</p>}
				{error && <IdentifyError>{error}</IdentifyError>}
				<div className="space-y-2">
					<Button className="h-11 w-full rounded-pill" disabled={loading || cooldown > 0} onClick={() => void requestMagicLink(true)} type="button" variant="outline">
						{loading && <LuLoaderCircle className="size-4 animate-spin" />}
						{cooldown > 0 ? t("store.checkout.identify.resendIn", { seconds: cooldown }) : t("store.checkout.identify.resend")}
					</Button>
					<Button className="h-11 w-full rounded-pill text-muted-foreground" onClick={() => { setStep("form"); setError(null); setResent(false); }} type="button" variant="outline">
						{t("store.checkout.identify.changeEmail")}
					</Button>
				</div>
			</div>
		);
	}

	return (
		<form className="animate-slide-in-3d space-y-4" onSubmit={event => { event.preventDefault(); void (accessMethod === "password" ? signInWithPassword() : requestMagicLink()); }}>
			<Label>
				<span>{t("store.checkout.identify.email")} <RequiredMark /></span>
				<div className="relative">
					<LuMail className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground/70" />
					<Input autoComplete="email" className={cn("h-12 rounded-pill pr-10 pl-10", emailIsValid && "border-success/60")} name="email" onChange={event => { setEmail(event.currentTarget.value); setError(null); }} placeholder="voce@email.com" type="email" value={email} />
					{emailIsValid && <LuCircleCheck className="absolute top-1/2 right-3.5 size-4.5 -translate-y-1/2 text-success" />}
				</div>
			</Label>
			<p className="text-muted-foreground text-xs">{t(`store.checkout.identify.${accessMethod === "password" ? "passwordHint" : "emailHint"}`)}</p>
			{accessMethod === "password" && (
				<Label>
					<span>{t("store.checkout.identify.password")} <RequiredMark /></span>
					<Input autoComplete="current-password" className="h-12 rounded-pill" name="password" onChange={event => { setPassword(event.currentTarget.value); setError(null); }} placeholder={t("store.checkout.identify.passwordPlaceholder")} type="password" value={password} />
				</Label>
			)}
			{error && <IdentifyError>{error}</IdentifyError>}
			<Button className="h-12 w-full rounded-pill font-bold text-base" disabled={loading || !emailIsValid || (accessMethod === "password" && !password)} type="submit">
				{loading && <LuLoaderCircle className="size-4 animate-spin" />}
				{t(loading ? (accessMethod === "password" ? "store.checkout.identify.signingIn" : "store.checkout.identify.sending") : (accessMethod === "password" ? "store.checkout.identify.signInWithPassword" : "store.checkout.identify.sendLink"))}
			</Button>
			<Button className="h-11 w-full" onClick={() => { setAccessMethod(current => current === "magic-link" ? "password" : "magic-link"); setError(null); }} type="button" variant="outline">
				{t(accessMethod === "password" ? "store.checkout.identify.signInWithLink" : "store.checkout.identify.signInWithPassword")}
			</Button>
		</form>
	);
}
