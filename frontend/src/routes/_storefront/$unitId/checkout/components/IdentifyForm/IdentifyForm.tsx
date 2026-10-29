import { useEffect, useState } from "react";
import { Trans, useTranslation } from "react-i18next";
import { FaWhatsapp } from "react-icons/fa6";
import { LuCircleCheck, LuLoaderCircle, LuMail } from "react-icons/lu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label, RequiredMark } from "@/components/ui/label";
import { useDebouncedInput } from "@/hooks/use-debounced-input";
import { authClient } from "@/lib/auth-client";
import { trackNewRegistration } from "@/lib/registration-tracking";
import { requestMagicLink as sendMagicLinkRequest } from "@/lib/request-magic-link";
import { cn } from "@/lib/utils";
import { mapSessionUser, useAuthStore } from "@/stores/auth";
import { IdentifyError } from "./IdentifyError";
import { formatBrazilianWhatsAppInput, getIdentifierKind, isValidEmail, isValidOtp, toBrazilianE164 } from "./whatsapp-auth";

type AccessMethod = "magic-link" | "password";
type Step = "form" | "email-sent" | "phone-code";

interface IdentifyFormProps {
	returnTo?: string;
	unitSlug?: string;
}

export function IdentifyForm({ returnTo, unitSlug }: IdentifyFormProps) {
	const { t } = useTranslation();
	const signIn = useAuthStore(state => state.signIn);
	const setUser = useAuthStore(state => state.setUser);
	const [accessMethod, setAccessMethod] = useState<AccessMethod>("magic-link");
	const [step, setStep] = useState<Step>("form");
	const [identifier, setIdentifier] = useDebouncedInput("", () => undefined);
	const [password, setPassword] = useDebouncedInput("", () => undefined);
	const [code, setCode] = useDebouncedInput("", () => undefined);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [cooldown, setCooldown] = useState(0);
	const [resent, setResent] = useState(false);
	const identifierKind = getIdentifierKind(identifier);
	const emailIsValid = isValidEmail(identifier);
	const phoneNumber = identifierKind === "phone" ? toBrazilianE164(identifier) : null;
	const isPasswordLogin = accessMethod === "password";

	useEffect(() => {
		if (cooldown <= 0) return;
		const id = setTimeout(() => setCooldown(current => current - 1), 1000);
		return () => clearTimeout(id);
	}, [cooldown]);

	async function sendAccess(isResend = false) {
		if (!identifierKind) return;
		setError(null);
		setLoading(true);
		try {
			if (identifierKind === "email") {
				await sendMagicLinkRequest({
					email: identifier.trim(),
					metadata: { redirectTo: returnTo ?? "", unitId: unitSlug ?? "" },
				});
				setResent(isResend);
				setStep("email-sent");
			} else {
				const { error: sendError } = await authClient.phoneNumber.sendOtp({ phoneNumber: phoneNumber! });
				if (sendError) {
					setError(t(sendError.code === "PHONE_LOGIN_NOT_ENABLED"
						? "store.checkout.identify.errors.phoneLoginNotEnabled"
						: sendError.status === 429 ? "store.checkout.identify.errors.rateLimited" : "store.checkout.identify.errors.otpSend"));
					return;
				}
				setStep("phone-code");
			}
			setCooldown(30);
		} catch {
			setError(t(identifierKind === "email" ? "store.checkout.identify.errors.send" : "store.checkout.identify.errors.otpSend"));
		} finally {
			setLoading(false);
		}
	}

	async function signInWithPassword() {
		if (!emailIsValid || !password) return;
		setError(null);
		setLoading(true);
		await signIn({
			defaultUserName: "Cliente",
			email: identifier.trim(),
			invalidCredentialsMessage: t("store.checkout.identify.errors.invalidCredentials"),
			password,
		});
		const signInError = useAuthStore.getState().error;
		if (signInError) setError(signInError);
		setLoading(false);
	}

	async function verifyOtp() {
		if (!phoneNumber || !isValidOtp(code)) return;
		setLoading(true);
		setError(null);
		try {
			const { error: verifyError } = await authClient.phoneNumber.verify({
				code: code.replace(/\D/g, ""),
				phoneNumber,
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
			trackNewRegistration(session.data.user.id);
			setUser(mapSessionUser(session.data.user));
		} catch {
			setError(t("store.checkout.identify.errors.otpInvalid"));
		} finally {
			setLoading(false);
		}
	}

	function returnToForm() {
		setStep("form");
		setCode("");
		setError(null);
		setResent(false);
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
							values={{ email: identifier.trim() }}
						/>
					</p>
				</div>
				{resent && !loading && <p className="font-medium text-success text-xs">{t("store.checkout.identify.linkResent")}</p>}
				{error && <IdentifyError>{error}</IdentifyError>}
				<div className="space-y-2">
					<Button className="h-11 w-full rounded-pill" disabled={loading || cooldown > 0} onClick={() => void sendAccess(true)} type="button" variant="outline">
						{loading && <LuLoaderCircle className="size-4 animate-spin" />}
						{cooldown > 0 ? t("store.checkout.identify.resendIn", { seconds: cooldown }) : t("store.checkout.identify.resend")}
					</Button>
					<Button className="h-11 w-full rounded-pill text-muted-foreground" onClick={returnToForm} type="button" variant="outline">
						{t("store.checkout.identify.changeEmail")}
					</Button>
				</div>
			</div>
		);
	}

	if (step === "phone-code") {
		return (
			<form className="animate-slide-in-3d space-y-4" onSubmit={event => { event.preventDefault(); void verifyOtp(); }}>
				<div className="flex items-center gap-2 rounded-lg border border-success/30 bg-success/10 px-3.5 py-2.5 text-success text-sm">
					<LuCircleCheck className="size-4 shrink-0" />
					{t("store.checkout.identify.otpSent")}
				</div>
				<Label>
					<span>{t("store.checkout.identify.code")} <RequiredMark /></span>
					<Input
						autoComplete="one-time-code"
						inputMode="numeric"
						maxLength={6}
						name="one-time-code"
						onChange={event => { setCode(event.currentTarget.value.replace(/\D/g, "")); setError(null); }}
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
				<Button className="h-11 w-full" disabled={loading || cooldown > 0} onClick={() => void sendAccess()} type="button" variant="outline">
					{cooldown > 0 ? t("store.checkout.identify.resendIn", { seconds: cooldown }) : t("store.checkout.identify.resendCode")}
				</Button>
				<Button className="h-11 w-full" onClick={returnToForm} type="button" variant="outline">{t("store.checkout.identify.changePhone")}</Button>
			</form>
		);
	}

	const IdentifierIcon = identifierKind === "phone" ? FaWhatsapp : LuMail;
	const primaryLabel = identifierKind === "phone" ? "sendCode" : "sendLink";
	const isPrimaryDisabled = loading || !identifierKind;

	return (
		<form
			className="animate-slide-in-3d space-y-4"
			onSubmit={event => {
				event.preventDefault();
				void (isPasswordLogin ? signInWithPassword() : sendAccess());
			}}
		>
			<Label>
				<span>{t(isPasswordLogin ? "store.checkout.identify.email" : "store.checkout.identify.contact")} <RequiredMark /></span>
				<div className="relative">
					<IdentifierIcon className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground/70" />
					<Input
						autoComplete={isPasswordLogin ? "email" : "username"}
						className={cn("h-12 rounded-pill pr-10 pl-10", identifierKind && "border-success/60")}
						inputMode={identifierKind === "phone" ? "tel" : "email"}
						name="identifier"
						onChange={event => { setIdentifier(formatBrazilianWhatsAppInput(event.currentTarget.value)); setError(null); }}
						placeholder={isPasswordLogin ? "voce@email.com" : t("store.checkout.identify.contactPlaceholder")}
						type="text"
						value={identifier}
					/>
					{identifierKind && <LuCircleCheck className="absolute top-1/2 right-3.5 size-4.5 -translate-y-1/2 text-success" />}
				</div>
			</Label>
			{isPasswordLogin && (
				<Label>
					<span>{t("store.checkout.identify.password")} <RequiredMark /></span>
					<Input
						autoComplete="current-password"
						className="h-12 rounded-pill"
						name="password"
						onChange={event => { setPassword(event.currentTarget.value); setError(null); }}
						placeholder={t("store.checkout.identify.passwordPlaceholder")}
						type="password"
						value={password}
					/>
				</Label>
			)}
			{isPasswordLogin && identifier.trim() && !emailIsValid && <IdentifyError>{t("store.checkout.identify.errors.passwordRequiresEmail")}</IdentifyError>}
			{error && <IdentifyError>{error}</IdentifyError>}
			<Button
				className="h-12 w-full rounded-pill font-bold text-base"
				disabled={isPasswordLogin ? loading || !emailIsValid || !password : isPrimaryDisabled}
				type="submit"
			>
				{loading && <LuLoaderCircle className="size-4 animate-spin" />}
				{t(loading ? (isPasswordLogin ? "store.checkout.identify.signingIn" : "store.checkout.identify.sending") : (isPasswordLogin ? "store.checkout.identify.signInWithPassword" : `store.checkout.identify.${primaryLabel}`))}
			</Button>
			{!isPasswordLogin && identifierKind === "phone" ? (
				<p className="text-center text-muted-foreground text-xs">{t("store.checkout.identify.passwordEmailOnly")}</p>
			) : (
				<Button
					className="h-11 w-full"
					onClick={() => { setAccessMethod(current => current === "magic-link" ? "password" : "magic-link"); setError(null); }}
					type="button"
					variant="outline"
				>
					{t(isPasswordLogin ? "store.checkout.identify.signInWithLink" : "store.checkout.identify.signInWithPassword")}
				</Button>
			)}
		</form>
	);
}
